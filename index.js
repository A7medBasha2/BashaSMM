import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import WebSocket from 'ws';

puppeteer.use(StealthPlugin());

// تهيئة الاتصال بـ Supabase مع تفعيل الـ WebSocket يدوياً لبيئة Node.js v20
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY, 
  {
    auth: { persistSession: false },
    realtime: { transport: WebSocket }
  }
);

async function runBot() {
  console.log('جارٍ البحث عن المهام المعلقة...');

  // 1. جلب أول مهمة معلقة مع بيانات الحساب المرتبط بها
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

  if (!account) {
    console.error('خطأ: لم يتم العثور على بيانات الحساب المرتبط بهذه المهمة.');
    await supabase.from('bot_tasks').update({ status: 'failed', error_message: 'Account not found' }).eq('id', currentTask.id);
    return;
  }

  console.log(`جارٍ بدء المهمة للحساب: ${account.email}`);

  // تحديث حالة المهمة إلى قيد التنفيذ
  await supabase.from('bot_tasks').update({ status: 'in_progress' }).eq('id', currentTask.id);

  // 2. تشغيل المتصفح الوهمي (Puppeteer)
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  
  // ضبط بصمة الموبايل (Pixel 5)
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36');
  await page.setViewport({ width: 393, height: 851, isMobile: true });

  try {
    // 3. تسجيل الدخول إلى فيسبوك
    console.log('الانتقال إلى صفحة تسجيل الدخول...');
    await page.goto('https://m.facebook.com/login', { waitUntil: 'networkidle2' });

    await page.type('input[name="email"]', account.email);
    await page.type('input[name="pass"]', account.password);
    
    // الضغط على زر تسجيل الدخول بطريقة مرنة ومضمونة للموبايل
    await Promise.all([
      page.click('button[name="login"], button[type="submit"], input[name="login"], button[id*="login"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})
    ]);

    // 4. استخراج بيانات البروفايل أوتوماتيكياً
    console.log('الانتقال إلى صفحة البروفايل لاستخراج البيانات...');
    await page.goto('https://m.facebook.com/me', { waitUntil: 'networkidle2' });
    
    const profileData = await page.evaluate(() => {
      const nameEl = document.querySelector('h1') || document.querySelector('strong') || document.querySelector('div[role="heading"]');
      const imgEl = document.querySelector('img[alt*="profile"], img[src*="scontent"], img[class*="img"]');
      return {
        full_name: nameEl ? nameEl.innerText.trim() : null,
        avatar_url: imgEl ? imgEl.src : null
      };
    });

    console.log('تم استخراج البيانات بنجاح:', profileData);

    // 5. تحديث جدول الأكونتات بالبيانات الحقيقية المستخرجة
    await supabase.from('bot_accounts').update({
      username: profileData.full_name || account.username,
      avatar_url: profileData.avatar_url,
      status: 'active'
    }).eq('id', account.id);

    // إنهاء المهمة بنجاح
    await supabase.from('bot_tasks').update({ status: 'completed' }).eq('id', currentTask.id);
    console.log('تمت المهمة بنجاح وتحديث بيانات الحساب في قاعدة البيانات! 🎉');

  } catch (err) {
    console.error('حدث خطأ أثناء تنفيذ الأوتوميشن:', err);
    await supabase.from('bot_tasks').update({ status: 'failed', error_message: err.message }).eq('id', currentTask.id);
  } finally {
    await browser.close();
  }
}

runBot();
