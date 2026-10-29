import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runBot() {
  // 1. جلب المهمة المعلقة اللي لسه ضايفينها
  const { data: tasks, error: taskErr } = await supabase
    .from('bot_tasks')
    .select('*, bot_accounts(*)')
    .eq('status', 'pending')
    .limit(1);

  if (taskErr || !tasks || tasks.length === 0) {
    console.log('لا توجد مهام معلقة حالياً.');
    return;
  }

  const currentTask = tasks[0];
  const account = currentTask.bot_accounts;

  console.log(`جارٍ بدء المهمة للحساب: ${account.email}`);

  // 2. تشغيل المتصفح
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36');

  try {
    // تحديث حالة المهمة إلى قيد التنفيذ
    await supabase.from('bot_tasks').update({ status: 'in_progress' }).eq('id', currentTask.id);

    // تسجيل الدخول
    await page.goto('https://m.facebook.com/login', { waitUntil: 'networkidle2' });
    await page.type('input[name="email"]', account.email);
    await page.type('input[name="pass"]', account.password);
    await page.click('button[name="login"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // 3. استخراج بيانات البروفايل أوتوماتيكياً
    await page.goto('https://m.facebook.com/me', { waitUntil: 'networkidle2' });
    
    const profileData = await page.evaluate(() => {
      const nameEl = document.querySelector('h1') || document.querySelector('strong');
      const imgEl = document.querySelector('img[alt*="profile"], img[src*="scontent"]');
      return {
        full_name: nameEl ? nameEl.innerText : null,
        avatar_url: imgEl ? imgEl.src : null
      };
    });

    console.log('تم استخراج بيانات البروفايل:', profileData);

    // 4. تحديث جدول الأكونتات بالبيانات الجديدة
    await supabase.from('bot_accounts').update({
      username: profileData.full_name || account.username,
      avatar_url: profileData.avatar_url,
      status: 'active'
    }).eq('id', account.id);

    // إنهاء المهمة بنجاح
    await supabase.from('bot_tasks').update({ status: 'completed' }).eq('id', currentTask.id);
    console.log('تمت المهمة بنجاح وتحديث بيانات الحساب! 🎉');

  } catch (err) {
    console.error('حدث خطأ أثناء التنفيذ:', err);
    await supabase.from('bot_tasks').update({ status: 'failed', error_message: err.message }).eq('id', currentTask.id);
  } finally {
    await browser.close();
  }
}

runBot();
