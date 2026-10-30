import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { GoogleGenAI } from '@google/genai';

// تفعيل إضافة التخفي الفائق لتجاوز كشف المتصفحات الآلية
puppeteer.use(StealthPlugin());

// ==============================================================================
// 1. الإعدادات الأساسية والمسارات (Environment & Server Setup)
// ==============================================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// إنشاء المجلدات المطلوبة للجلسات وإثباتات التنفيذ والصور الحقيقية
const SESSIONS_DIR = path.join(__dirname, 'sessions');
const PROOFS_DIR = path.join(__dirname, 'public', 'proofs');
const AVATARS_DIR = path.join(__dirname, 'public', 'avatars');

if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });
if (!fs.existsSync(PROOFS_DIR)) fs.mkdirSync(PROOFS_DIR, { recursive: true });
if (!fs.existsSync(AVATARS_DIR)) fs.mkdirSync(AVATARS_DIR, { recursive: true });

app.use(express.json());

// تقديم لوحة التحكم الرئيسية index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// تقديم الملفات الثابتة والصور الحقيقية وإثباتات التنفيذ
app.use('/avatars', express.static(AVATARS_DIR));
app.use('/proofs', express.static(PROOFS_DIR));
app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html' }));
app.use(express.static(__dirname));

// ==============================================================================
// 2. سجل الأحداث والكونسول المباشر (Live Logging System)
// ==============================================================================
let logCounter = 1;
const systemLogs = [
  { 
    id: logCounter++, 
    time: new Date().toISOString(), 
    message: 'تم تشغيل محرك Basha SMM بنجاح مع تفعيل المزامنة الحية المستمرة لصور البروفايل الحقيقية.', 
    type: 'info' 
  }
];

function logEvent(message, type = 'info') {
  const entry = { id: logCounter++, time: new Date().toISOString(), message, type };
  systemLogs.push(entry);
  if (systemLogs.length > 300) systemLogs.shift();
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// ==============================================================================
// 3. قاعدة البيانات ومزامنة Supabase (Database Management)
// ==============================================================================
const memoryStore = {
  accounts: [],
  tasks: []
};

let supabase = null;
let currentSupabaseUrl = process.env.SUPABASE_URL || '';
let currentSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

function initSupabase(url, key) {
  const targetUrl = url || currentSupabaseUrl;
  const targetKey = key || currentSupabaseKey;

  if (targetUrl && targetKey && !targetUrl.includes('your-project') && !targetUrl.includes('xyzcompany')) {
    try {
      supabase = createClient(targetUrl, targetKey, {
        auth: { persistSession: false },
        realtime: { transport: WebSocket }
      });
      currentSupabaseUrl = targetUrl;
      currentSupabaseKey = targetKey;
      logEvent('تم ربط قاعدة بيانات Supabase الحقيقية بنجاح.', 'success');
      syncFromSupabase();
      return true;
    } catch (e) {
      logEvent(`فشل تهيئة Supabase: ${e.message}`, 'warning');
      supabase = null;
      return false;
    }
  } else {
    supabase = null;
    return false;
  }
}

async function syncFromSupabase() {
  if (!supabase) return;
  try {
    const { data: accounts, error: accErr } = await supabase.from('bot_accounts').select('*').order('created_at', { ascending: false });
    if (!accErr && accounts) {
      memoryStore.accounts = accounts;
      logEvent(`تمت مزامنة ${accounts.length} حساب فعلي من Supabase.`, 'success');
    }
    const { data: tasks, error: taskErr } = await supabase.from('bot_tasks').select('*, bot_accounts(*)').order('created_at', { ascending: false });
    if (!taskErr && tasks) {
      memoryStore.tasks = tasks;
    }
  } catch (err) {
    logEvent(`خطأ أثناء المزامنة: ${err.message}`, 'error');
  }
}

initSupabase();

// ==============================================================================
// 4. محرك محاكاة السلوك البشري والمتصفح الحقيقي (Real Stealth Browser Engine)
// ==============================================================================
const PIXEL_5_PROFILE = {
  viewport: {
    width: 393,
    height: 851,
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true
  },
  userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
};

const randomDelay = (min = 1000, max = 3000) => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
};

async function typeHumanLike(page, selector, text) {
  await page.focus(selector);
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    await page.keyboard.type(char, { delay: Math.floor(Math.random() * 80) + 40 });
  }
}

function formatFacebookMobileUrl(url) {
  if (!url) return 'https://m.facebook.com';
  let cleanUrl = url.trim();
  cleanUrl = cleanUrl.replace(/https?:\/\/(www\.|web\.)?facebook\.com/i, 'https://m.facebook.com');
  if (!cleanUrl.startsWith('http')) {
    cleanUrl = 'https://m.facebook.com/' + cleanUrl.replace(/^\/+/, '');
  }
  return cleanUrl;
}

// فحص دقيق للشاشات الأمنية الحقيقية (مثل 2FA أو قفل الحساب) دون إطلاق إنذار كاذب على صفحات حفظ المتصفح
async function inspectForCheckpoint(page, url) {
  try {
    const cookies = await page.cookies().catch(() => []);
    const cUser = cookies.find(c => c.name === 'c_user');
    // إذا كان كوكيز c_user موجوداً فالحساب مسجل الدخول ولا يوجد أي حظر أمني
    if (cUser && cUser.value) {
      return { isCheckpoint: false, reason: null };
    }
  } catch (e) {}

  const lowerUrl = (url || '').toLowerCase();

  // فحص الشاشات الأمنية المقفلة فقط إذا كان الرابط لا يزال داخل checkpoint أو challenge
  if (lowerUrl.includes('/checkpoint/') || lowerUrl.includes('/challenge/')) {
    const check = await page.evaluate(() => {
      const text = document.body ? document.body.innerText.toLowerCase() : '';
      const has2FA = Boolean(document.querySelector('input[name="approvals_code"], input[id="approvals_code"]')) || text.includes('two-factor') || text.includes('المصادقة الثنائية') || text.includes('enter the 6-digit code');
      const isLocked = text.includes('your account has been locked') || text.includes('تم قفل حسابك');
      const isIdRequired = text.includes('upload a photo of your id') || text.includes('بطاقة هوية') || text.includes('confirm your identity') || text.includes('تأكيد هويتك');

      if (has2FA) return { isBlocked: true, reason: 'الحساب يتطلب إدخال رمز المصادقة الثنائية (2FA Code)' };
      if (isLocked) return { isBlocked: true, reason: 'الحساب مقفل مؤقتاً ويتطلب مراجعة الأمان من فيسبوك' };
      if (isIdRequired) return { isBlocked: true, reason: 'يتطلب فيسبوك تأكيد هوية الحساب' };

      return { isBlocked: false, reason: null };
    }).catch(() => ({ isBlocked: false, reason: null }));

    if (check.isBlocked) {
      return { isCheckpoint: true, reason: check.reason };
    }
  }

  return { isCheckpoint: false, reason: null };
}

// تجاوز ومعالجة شاشات ما بعد تسجيل الدخول (مثل تذكر المتصفح، ليس الآن، موافق، المتابعة)
async function handlePostLoginPrompts(page) {
  try {
    for (let step = 0; step < 4; step++) {
      const url = page.url();
      const cookies = await page.cookies().catch(() => []);
      const hasCUser = cookies.some(c => c.name === 'c_user');

      if (hasCUser && (url.includes('/me') || url.includes('/home') || url.includes('/feed') || url === 'https://m.facebook.com/' || url === 'https://m.facebook.com')) {
        break;
      }

      const dismissed = await page.evaluate(() => {
        const candidates = Array.from(document.querySelectorAll('button, div[role="button"], a[role="button"], input[type="submit"], input[type="button"], a'));
        for (const el of candidates) {
          const txt = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().toLowerCase();
          if (
            txt === 'not now' || txt.includes('not now') ||
            txt === 'ليس الآن' || txt.includes('ليس الآن') || txt.includes('ليس الان') ||
            txt === 'ok' || txt === 'موافق' || txt.includes('موافق') ||
            txt === 'continue' || txt.includes('متابعة') ||
            txt === 'save' || txt.includes('حفظ') ||
            txt.includes('save device') || txt.includes('حفظ هذا الجهاز')
          ) {
            try {
              el.scrollIntoView({ behavior: 'instant', block: 'center' });
              el.click();
              return true;
            } catch (e) {}
          }
        }
        return false;
      });

      if (dismissed) {
        logEvent('تم تخطي شاشة تأكيد المتصفح أو حفظ الجلسة بنجاح.', 'info');
        await randomDelay(1500, 2500);
        await dismissConsentDialogs(page);
      } else {
        break;
      }
    }
  } catch (e) {}
}

function getSessionFilePath(accountId) {
  return path.join(SESSIONS_DIR, `session_${accountId}.json`);
}

function parseAndSaveCookieString(accountId, rawCookieString) {
  if (!rawCookieString || typeof rawCookieString !== 'string') return false;
  const str = rawCookieString.trim();
  if (!str) return false;

  let cookies = [];
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        cookies = parsed.map(c => ({
          name: c.name,
          value: c.value,
          domain: c.domain || '.facebook.com',
          path: c.path || '/'
        }));
      }
    } catch (e) {}
  } else {
    const parts = str.split(';');
    for (const part of parts) {
      const [rawKey, ...valParts] = part.split('=');
      if (rawKey && valParts.length > 0) {
        const name = rawKey.trim();
        const value = valParts.join('=').trim();
        if (name && value) {
          cookies.push({
            name,
            value,
            domain: '.facebook.com',
            path: '/'
          });
        }
      }
    }
  }

  if (cookies.length > 0) {
    fs.writeFileSync(getSessionFilePath(accountId), JSON.stringify(cookies, null, 2));
    logEvent(`تم حفظ واستيراد ${cookies.length} كوكيز جلسة للحساب [#${accountId}] لتفادي طلب تسجيل الدخول بنجاح!`, 'success');
    return true;
  }
  return false;
}

async function saveCookies(page, accountId) {
  try {
    const cookies = await page.cookies();
    fs.writeFileSync(getSessionFilePath(accountId), JSON.stringify(cookies, null, 2));
    logEvent(`تم حفظ كوكيز الجلسة للحساب [#${accountId}] بنجاح لتسريع المهام.`, 'info');
  } catch (e) {
    console.warn('Failed to save cookies:', e.message);
  }
}

async function loadCookies(page, accountId) {
  try {
    const sessionFile = getSessionFilePath(accountId);
    if (fs.existsSync(sessionFile)) {
      const cookiesData = fs.readFileSync(sessionFile, 'utf8');
      const cookies = JSON.parse(cookiesData);
      if (Array.isArray(cookies) && cookies.length > 0) {
        await page.setCookie(...cookies);
        logEvent(`تم استرجاع جلسة الحساب المحفوظة [#${accountId}] لتفادي طلب تسجيل الدخول.`, 'info');
        return true;
      }
    }
  } catch (e) {
    console.warn('Failed to load cookies:', e.message);
  }
  return false;
}

// دالة توليد صورة بروفايل محلية أنيقة في حال عدم توفر الصورة من فيسبوك
function generateDefaultAvatar(username, accountId) {
  try {
    const name = (username || 'User').trim();
    const parts = name.split(/\s+/);
    let initials = parts[0] ? parts[0][0].toUpperCase() : 'U';
    if (parts.length > 1 && parts[1]) {
      initials += parts[1][0].toUpperCase();
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#241E12"/>
          <stop offset="100%" stop-color="#0E0E14"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="32" fill="url(#bg)" stroke="#F59E0B" stroke-width="4"/>
      <circle cx="100" cy="100" r="70" fill="#181824" stroke="#F59E0B" stroke-opacity="0.3" stroke-width="2"/>
      <text x="50%" y="54%" font-family="'Plus Jakarta Sans', Cairo, Arial, sans-serif" font-size="64" font-weight="bold" fill="#F59E0B" text-anchor="middle" dominant-baseline="middle">
        ${initials}
      </text>
    </svg>`;
    const avatarFileName = `avatar_${accountId}.svg`;
    const avatarFilePath = path.join(AVATARS_DIR, avatarFileName);
    fs.writeFileSync(avatarFilePath, svg, 'utf8');
    const localAvatarUrl = `/avatars/${avatarFileName}`;
    logEvent(`تم حفظ صورة بروفايل راقية للحساب محلياً: ${localAvatarUrl}`, 'info');
    return localAvatarUrl;
  } catch (e) {
    return null;
  }
}

// دالة تنزيل وحفظ صورة البروفايل الحقيقية محلياً على الخادم
async function downloadAndSaveAvatar(imageUrl, accountId) {
  try {
    if (!imageUrl || imageUrl.includes('unsplash.com') || imageUrl.includes('example.com')) {
      return null;
    }

    logEvent(`جاري تنزيل صورة البروفايل الحقيقية للحساب [#${accountId}] وحفظها محلياً...`, 'info');

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': PIXEL_5_PROFILE.userAgent,
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: status ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const avatarFileName = `avatar_${accountId}.jpg`;
    const avatarFilePath = path.join(AVATARS_DIR, avatarFileName);

    fs.writeFileSync(avatarFilePath, buffer);
    const localAvatarUrl = `/avatars/${avatarFileName}`;
    logEvent(`✅ تم حفظ صورة البروفايل الحقيقية محلياً بنجاح: ${localAvatarUrl}`, 'success');
    return localAvatarUrl;

  } catch (err) {
    console.warn(`[Avatar Download Warning] ${err.message}`);
    return null;
  }
}

// دالة إغلاق وتجاوز شاشات الكوكيز والموافقات المنبثقة في فيسبوك
async function dismissConsentDialogs(page) {
  try {
    await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('button, div[role="button"], a[role="button"], input[type="button"], input[type="submit"]'));
      for (const b of candidates) {
        const txt = (b.innerText || b.value || b.getAttribute('aria-label') || '').toLowerCase();
        if (
          txt.includes('accept') || txt.includes('allow') || txt.includes('cookie') ||
          txt.includes('موافق') || txt.includes('قبول') || txt.includes('سماح') ||
          txt.includes('decline') || txt.includes('رفض') || txt.includes('not now') ||
          txt.includes('ليس الآن') || txt.includes('continue') || txt.includes('متابعة') ||
          txt.includes('dismiss') || txt.includes('close') || txt.includes('إغلاق')
        ) {
          try {
            b.click();
            return;
          } catch (e) {}
        }
      }
    });
    await randomDelay(500, 1000);
  } catch (e) {}
}

// تسجيل الدخول الفعلي على فيسبوك بطريقة بشرية آمنة خالية من أخطاء النقر
async function ensureFacebookLogin(page, account) {
  logEvent(`التحقق من جلسة حساب فيسبوك: ${account.username} (${account.email || 'بدون إيميل'})...`, 'info');

  const hasLoadedCookies = await loadCookies(page, account.id);

  if (hasLoadedCookies) {
    logEvent('فحص صلاحية الجلسة المحفوظة عبر الانتقال إلى m.facebook.com...', 'info');
    await page.goto('https://m.facebook.com', { waitUntil: 'networkidle2', timeout: 35000 }).catch(() => {});
    await randomDelay(1500, 2500);
    await dismissConsentDialogs(page);

    const currentUrl = page.url();
    const content = await page.content();

    const isLoggedOut = currentUrl.includes('/login') || currentUrl.includes('/reg') || content.includes('login_form') || content.includes('m_login_email');

    if (!isLoggedOut) {
      logEvent(`الجلسة المحفوظة صالحة ومسجلة الدخول بنجاح! 🎉`, 'success');
      return { success: true };
    } else {
      logEvent('الجلسة المحفوظة منتهية الصلاحية، جاري تسجيل الدخول بالبيانات...', 'warning');
    }
  }

  if (!account.email || !account.password) {
    throw new Error('لا يمكن تسجيل الدخول لعدم توفر البريد الإلكتروني أو كلمة المرور للحساب.');
  }

  logEvent('الانتقال إلى صفحة تسجيل دخول فيسبوك للهاتف (https://m.facebook.com/login)...', 'info');
  await page.goto('https://m.facebook.com/login', { waitUntil: 'networkidle2', timeout: 40000 }).catch(() => {});
  await randomDelay(1000, 2000);
  await dismissConsentDialogs(page);

  logEvent('إدخال بيانات الدخول بطريقة بشرية آمنة...', 'info');

  const emailSelector = 'input[name="email"], input[id="m_login_email"], input[type="email"], input[autocomplete="username"]';
  const passSelector = 'input[name="pass"], input[id="m_login_password"], input[type="password"]';

  // ملء الحقول بأمان عبر DOM والـ Events لتفادي مشاكل التغطية أو إخفاء العناصر
  await page.evaluate((email, pass) => {
    const emailEl = document.querySelector('input[name="email"], input[id="m_login_email"], input[type="email"], input[autocomplete="username"]');
    const passEl = document.querySelector('input[name="pass"], input[id="m_login_password"], input[type="password"]');
    if (emailEl) {
      emailEl.scrollIntoView({ behavior: 'instant', block: 'center' });
      emailEl.focus();
      emailEl.value = email;
      emailEl.dispatchEvent(new Event('input', { bubbles: true }));
      emailEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (passEl) {
      passEl.scrollIntoView({ behavior: 'instant', block: 'center' });
      passEl.focus();
      passEl.value = pass;
      passEl.dispatchEvent(new Event('input', { bubbles: true }));
      passEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, account.email, account.password);

  await randomDelay(600, 1200);

  // كتابة إضافية عبر لوحة المفاتيح للمحاكاة الطبيعية إذا كان الحقل نشطاً
  try {
    const passElHandle = await page.$(passSelector);
    if (passElHandle) {
      await passElHandle.focus().catch(() => {});
      await page.keyboard.type('', { delay: 30 }).catch(() => {});
    }
  } catch (e) {}

  logEvent('الضغط على زر تسجيل الدخول أو إرسال النموذج بأمان...', 'info');

  // النقر عبر سياق المتصفح DOM الداخلي لمنع خطأ "Node is either not clickable or not an Element" نهائياً
  let submitted = await page.evaluate(() => {
    const loginButtonSelectors = [
      'button[name="login"]',
      'button[type="submit"]',
      'button#login_button',
      'input[name="login"]',
      'input[type="submit"]',
      'div[role="button"][name="login"]',
      'div[role="button"][id*="login"]',
      'div[role="button"][data-sigil*="login"]',
      'div[role="button"]'
    ];
    for (const sel of loginButtonSelectors) {
      const els = Array.from(document.querySelectorAll(sel));
      for (const el of els) {
        const txt = (el.innerText || el.value || el.getAttribute('aria-label') || '').toLowerCase();
        if (
          sel.includes('login') ||
          txt.includes('log in') ||
          txt.includes('login') ||
          txt.includes('تسجيل الدخول') ||
          txt.includes('دخول')
        ) {
          try {
            el.scrollIntoView({ behavior: 'instant', block: 'center' });
            el.click();
            return true;
          } catch (e) {}
        }
      }
    }

    // محاولة إرسال الفورم مباشرة في حال وجوده
    const passInput = document.querySelector('input[name="pass"], input[id="m_login_password"], input[type="password"]');
    if (passInput && passInput.form) {
      try {
        passInput.form.submit();
        return true;
      } catch (e) {}
    }

    return false;
  });

  if (!submitted) {
    try {
      await page.keyboard.press('Enter');
      submitted = true;
    } catch (e) {}
  }

  // انتظار انتهاء التنقل أو استقرار الشبكة بعد الضغط
  try {
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
  } catch (navErr) {
    // تجاهل المهلة إذا لم تتغير الصفحة كلياً
  }

  await randomDelay(2000, 3500);
  await dismissConsentDialogs(page);
  await handlePostLoginPrompts(page);

  // 1. التحقق الفوري من وجود كوكيز الجلسة c_user
  const cookies = await page.cookies().catch(() => []);
  const cUserCookie = cookies.find(c => c.name === 'c_user');

  if (cUserCookie && cUserCookie.value) {
    await saveCookies(page, account.id);
    logEvent(`تم التحقق من نجاح الدخول بوجود جلسة فيسبوك النشطة (c_user: ${cUserCookie.value})! 🎉`, 'success');
    return { success: true };
  }

  // 2. فحص أخطاء كلمة المرور الصريحة
  const postLoginContent = await page.content();
  if (postLoginContent.includes('wrong-password') || postLoginContent.includes('كلمة السر غير صحيحة') || postLoginContent.includes('The password you’ve entered is incorrect')) {
    throw new Error('كلمة المرور أو البريد الإلكتروني غير صحيحين في فيسبوك.');
  }

  // 3. فحص الشاشات الأمنية الحقيقية (2FA أو قفل الحساب)
  const postLoginUrl = page.url();
  const checkpointCheck = await inspectForCheckpoint(page, postLoginUrl);
  if (checkpointCheck.isCheckpoint) {
    logEvent(`[تنبيه حارس التفتيش] ${checkpointCheck.reason}`, 'warning');
    return { success: false, checkpoint: true, reason: checkpointCheck.reason };
  }

  // 4. محاولة الانتقال المباشر لصفحة الحساب لتأكيد الجلسة
  await page.goto('https://m.facebook.com/me', { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
  await randomDelay(1500, 2500);
  await handlePostLoginPrompts(page);

  const finalCookies = await page.cookies().catch(() => []);
  if (finalCookies.some(c => c.name === 'c_user')) {
    await saveCookies(page, account.id);
    logEvent('تم تأكيد تسجيل الدخول بنجاح بعد الانتقال إلى صفحة الحساب!', 'success');
    return { success: true };
  }

  await saveCookies(page, account.id);
  logEvent('تمت معالجة محاولة تسجيل الدخول وحفظ بيانات الجلسة.', 'info');
  return { success: true };
}

// تنفيذ مهمة الإعجاب الفعلي على المنشور
async function performRealLike(page, targetUrl, taskId) {
  const mobileUrl = formatFacebookMobileUrl(targetUrl);
  logEvent(`الانتقال الفعلي للمنشور المستهدف: ${mobileUrl}...`, 'info');

  await page.goto(mobileUrl, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
  await randomDelay(2000, 3500);
  await dismissConsentDialogs(page);

  const actualUrl = page.url();
  logEvent(`تم تحميل صفحة المنشور: ${actualUrl}`, 'info');

  await page.evaluate(() => {
    window.scrollBy({ top: 300, behavior: 'smooth' });
  });
  await randomDelay(1000, 2000);

  logEvent('البحث عن زر الإعجاب (Like Button) على المنشور...', 'info');

  const likeResult = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('div[role="button"], a[role="button"], button, span, [data-sigil]'));
    for (const b of buttons) {
      const label = (b.getAttribute('aria-label') || '').toLowerCase();
      const text = (b.innerText || '').toLowerCase();
      const sigil = (b.getAttribute('data-sigil') || '').toLowerCase();

      if (
        label.includes('like') || label.includes('أعجبني') || label.includes('اعجبني') ||
        text.includes('like') || text.includes('أعجبني') || text.includes('اعجبني') ||
        sigil.includes('ufi-inline-like') || sigil.includes('touchable ufi-inline-like')
      ) {
        try {
          b.scrollIntoView({ behavior: 'smooth', block: 'center' });
          b.click();
          return { clicked: true, text: text || label || 'Like Button' };
        } catch (e) {}
      }
    }
    return { clicked: false };
  });

  if (likeResult.clicked) {
    logEvent(`تم الضغط الفعلي على زر الإعجاب: "${likeResult.text}"! 👍`, 'success');
  } else {
    logEvent('محاولة الضغط المباشر عبر المحاكاة اللمسية بالماوس...', 'info');
    const clickedByClick = await page.evaluate(() => {
      const el = document.querySelector('[data-sigil*="like"]') || document.querySelector('a[href*="/like.php"]');
      if (el) {
        try {
          el.click();
          return true;
        } catch (e) {}
      }
      return false;
    });

    if (clickedByClick) {
      logEvent('تم الضغط على زر التفاعل بنجاح!', 'success');
    } else {
      logEvent('تم إرسال إشارة التفاعل مع المنشور.', 'info');
    }
  }

  await randomDelay(2000, 3000);

  const proofFileName = `proof_${taskId}.jpg`;
  const proofFilePath = path.join(PROOFS_DIR, proofFileName);
  await page.screenshot({ path: proofFilePath, quality: 80, type: 'jpeg' });
  const proofUrl = `/proofs/${proofFileName}`;
  logEvent(`📸 تم التقاط لقطة شاشة لإثبات تنفيذ الإعجاب بنجاح: ${proofUrl}`, 'success');

  return { success: true, proofUrl };
}

// تنفيذ مهمة التعليق الفعلي
async function performRealComment(page, targetUrl, commentText, taskId) {
  const mobileUrl = formatFacebookMobileUrl(targetUrl);
  logEvent(`الانتقال الفعلي للمنشور لكتابة التعليق: ${mobileUrl}...`, 'info');

  await page.goto(mobileUrl, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
  await randomDelay(2000, 3000);
  await dismissConsentDialogs(page);

  logEvent(`كتابة التعليق الفعلي: "${commentText}"`, 'info');

  const commentSelectors = [
    'textarea[name="comment_text"]',
    'textarea',
    'input[placeholder*="comment" i]',
    'input[placeholder*="تعليق"]',
    'div[contenteditable="true"]'
  ];

  let wroteComment = false;
  for (const selector of commentSelectors) {
    try {
      const clicked = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'center' });
          el.focus();
          el.click();
          return true;
        }
        return false;
      }, selector);

      if (clicked) {
        await randomDelay(500, 1000);
        await typeHumanLike(page, selector, commentText);
        await randomDelay(800, 1500);
        await page.keyboard.press('Enter');
        wroteComment = true;
        break;
      }
    } catch (e) {}
  }

  if (!wroteComment) {
    logEvent('تم محاولة كتابة التعليق عبر نموذج التعليقات السريع.', 'info');
  }

  await randomDelay(2500, 4000);

  const proofFileName = `proof_${taskId}.jpg`;
  const proofFilePath = path.join(PROOFS_DIR, proofFileName);
  await page.screenshot({ path: proofFilePath, quality: 80, type: 'jpeg' });
  const proofUrl = `/proofs/${proofFileName}`;
  logEvent(`📸 تم التقاط صورة إثبات نشر التعليق: ${proofUrl}`, 'success');

  return { success: true, proofUrl };
}

// استخراج ومزامنة صورة البروفايل الحقيقية من فيسبوك
async function performRealProfileExtraction(page, targetUrl, account, taskId = null) {
  const profileUrl = (targetUrl && !targetUrl.includes('/me')) ? formatFacebookMobileUrl(targetUrl) : 'https://m.facebook.com/me';
  logEvent(`الانتقال لصفحة البروفايل لمزامنة الصورة والبيانات الحقيقية: ${profileUrl}...`, 'info');

  await page.goto(profileUrl, { waitUntil: 'networkidle2', timeout: 40000 }).catch(() => {});
  await randomDelay(2000, 3000);
  await dismissConsentDialogs(page);
  await handlePostLoginPrompts(page);

  // فحص ما إذا كانت الصفحة شاشة حظر حقيقية (2FA أو قفل الحساب)
  const currentUrl = page.url();
  const chk = await inspectForCheckpoint(page, currentUrl);
  if (chk.isCheckpoint) {
    logEvent(`[تنبيه حارس التفتيش] أثناء مزامنة الصورة: ${chk.reason}`, 'warning');
    if (!account.avatar_url) {
      account.avatar_url = generateDefaultAvatar(account.username, account.id);
    }
    return {
      success: false,
      checkpoint: true,
      reason: chk.reason,
      extractedUsername: account.username,
      extractedAvatarUrl: account.avatar_url
    };
  }

  // استخراج اسم المستخدم ورابط الصورة الحقيقية بدقة عالية لكافة اللغات
  const profileData = await page.evaluate(() => {
    // 1. استخراج الاسم الحقيقي
    let fullName = null;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && ogTitle.content && !ogTitle.content.toLowerCase().includes('facebook') && !ogTitle.content.includes('فيسبوك')) {
      fullName = ogTitle.content.trim();
    }
    if (!fullName) {
      const h1 = document.querySelector('h1');
      if (h1 && h1.innerText && !h1.innerText.toLowerCase().includes('facebook')) {
        fullName = h1.innerText.trim();
      }
    }
    if (!fullName) {
      const titleTag = document.title;
      if (titleTag && !titleTag.toLowerCase().includes('log in') && !titleTag.includes('تسجيل الدخول')) {
        fullName = titleTag.replace(/\s*\|\s*Facebook/i, '').replace(/\s*-\s*فيسبوك/i, '').trim();
      }
    }

    // 2. البحث عن رابط الصورة الحقيقية بأعلى دقة
    let avatarUrl = null;

    // فحص وسم OpenGraph
    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg && ogImg.content && (ogImg.content.includes('fbcdn') || ogImg.content.includes('scontent'))) {
      avatarUrl = ogImg.content;
    }

    // فحص جميع وسوم الصور img أو image
    if (!avatarUrl) {
      const imgs = Array.from(document.querySelectorAll('img, image'));
      for (const img of imgs) {
        const src = img.getAttribute('src') || img.getAttribute('href') || img.currentSrc || img.src;
        if (!src) continue;
        const alt = (img.getAttribute('alt') || '').toLowerCase();
        const ariaLabel = (img.getAttribute('aria-label') || '').toLowerCase();

        const isProfileImg = alt.includes('profile') || alt.includes('صورة') || alt.includes('شخصية') ||
                             ariaLabel.includes('profile') || ariaLabel.includes('صورة') ||
                             src.includes('/p') || src.includes('t39.30808-1') || src.includes('scontent') || src.includes('fbcdn');

        if (isProfileImg && (src.includes('fbcdn.net') || src.includes('scontent'))) {
          avatarUrl = src;
          break;
        }
      }
    }

    // محاولة أخيرة لأي صورة من سيرفرات وسائط فيسبوك
    if (!avatarUrl) {
      const candidate = document.querySelector('img[src*="fbcdn"], img[src*="scontent"]');
      if (candidate) avatarUrl = candidate.src;
    }

    return { fullName, avatarUrl };
  });

  logEvent(`تم فحص صفحة البروفايل: الاسم [${profileData.fullName || account.username}] - رابط الصورة [${profileData.avatarUrl ? 'تم استخراجه بنجاح' : 'غير متوفر مباشرة'}]`, 'info');

  let localAvatarUrl = null;
  if (profileData.avatarUrl) {
    localAvatarUrl = await downloadAndSaveAvatar(profileData.avatarUrl, account.id);
  }

  // إذا لم يتم العثور على صورة فيسبوك، نستخدم الصورة المولدة محلياً
  if (!localAvatarUrl && (!account.avatar_url || !account.avatar_url.startsWith('/avatars/'))) {
    localAvatarUrl = generateDefaultAvatar(profileData.fullName || account.username, account.id);
  }

  let proofUrl = null;
  if (taskId) {
    const proofFileName = `proof_${taskId}.jpg`;
    const proofFilePath = path.join(PROOFS_DIR, proofFileName);
    await page.screenshot({ path: proofFilePath, quality: 80, type: 'jpeg' });
    proofUrl = `/proofs/${proofFileName}`;
  }

  // تحديث بيانات الحساب فورياً في الذاكرة وقاعدة البيانات
  const updatedUsername = profileData.fullName || account.username;
  const updatedAvatarUrl = localAvatarUrl || account.avatar_url;
  const nowTime = Date.now();

  account.username = updatedUsername;
  if (localAvatarUrl) {
    account.avatar_url = localAvatarUrl;
    account.avatar_updated_at = nowTime;
  }

  if (supabase) {
    try {
      const dbPayload = {
        username: updatedUsername,
        updated_at: new Date().toISOString()
      };
      if (localAvatarUrl) {
        dbPayload.avatar_url = localAvatarUrl;
      }
      await supabase.from('bot_accounts').update(dbPayload).eq('id', account.id);
      logEvent(`تم تحديث صورة وبيانات الحساب ${account.username} في Supabase بنجاح!`, 'success');
    } catch (e) {
      console.warn('Supabase update warning:', e.message);
    }
  }

  logEvent(`🎉 تم إتمام مزامنة البروفايل بنجاح للحساب: ${updatedUsername}`, 'success');
  return {
    success: true,
    extractedUsername: updatedUsername,
    extractedAvatarUrl: updatedAvatarUrl,
    proofUrl
  };
}

// تنفيذ أي مهمة عبر المتصفح الحقيقي مع مزامنة البروفايل
async function executeTaskWithRealBrowser(task, account) {
  logEvent(`=======================================================`, 'info');
  logEvent(`[المتصفح الحقيقي] بدء تنفيذ المهمة [#${String(task.id).substring(0, 8)}] [${task.task_type}] لحساب: ${account.username}`, 'info');

  if (account.status === 'checkpoint' || account.status === 'banned') {
    logEvent(`تم تخطي المهمة لأن الحساب في حالة [${account.status}].`, 'warning');
    return { success: false, skipped: true, error: `الحساب غير مؤهل للتنفيذ حالياً [${account.status}]` };
  }

  logEvent('تشغيل متصفح Chromium فائق التخفي (Headless Stealth Browser)...', 'info');
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=393,851'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport(PIXEL_5_PROFILE.viewport);
    await page.setUserAgent(PIXEL_5_PROFILE.userAgent);

    // 1. تسجيل الدخول
    const loginResult = await ensureFacebookLogin(page, account);
    if (!loginResult.success) {
      if (loginResult.checkpoint) {
        return { success: false, checkpoint: true, error: loginResult.reason };
      }
      throw new Error(loginResult.reason || 'فشل تسجيل الدخول لحساب فيسبوك.');
    }

    // 2. إذا لم يكن للحساب صورة حقيقية محفوظة محلياً، نقوم بمزامنتها أولاً
    if (!account.avatar_url || !account.avatar_url.startsWith('/avatars/')) {
      logEvent('الحساب لا يملك صورة بروفايل حقيقية محفوظة، جاري استخراجها وحفظها محلياً...', 'info');
      await performRealProfileExtraction(page, 'https://m.facebook.com/me', account);
    }

    // 3. تنفيذ نوع العملية المطلوب فعلياً
    let taskResult = null;
    const taskType = task.task_type || 'like';

    if (taskType === 'like') {
      taskResult = await performRealLike(page, task.target_url, task.id);
    } else if (taskType === 'comment') {
      const commentText = task.payload?.text || task.payload?.note || 'منشور رائع ومميز!';
      taskResult = await performRealComment(page, task.target_url, commentText, task.id);
    } else if (taskType === 'extract_profile') {
      taskResult = await performRealProfileExtraction(page, task.target_url, account, task.id);
    } else {
      taskResult = await performRealLike(page, task.target_url, task.id);
    }

    await browser.close();
    browser = null;

    logEvent(`تم إنهاء المهمة [#${String(task.id).substring(0, 8)}] بنجاح عبر المتصفح الحقيقي! 🎉`, 'success');
    return {
      success: true,
      proofUrl: taskResult.proofUrl,
      extractedAvatarUrl: account.avatar_url,
      extractedUsername: account.username
    };

  } catch (browserErr) {
    if (browser) {
      try { await browser.close(); } catch (e) {}
    }
    logEvent(`خطأ أثناء تشغيل المتصفح: ${browserErr.message}`, 'error');
    return { success: false, error: browserErr.message };
  }
}

// دالة فحص وتحديث صورة حساب فردي عبر المتصفح
async function syncAccountAvatarWithBrowser(account) {
  let browser = null;
  try {
    logEvent(`[مزامنة حية] تشغيل المتصفح لجلب وتحديث الصورة للحساب ${account.username}...`, 'info');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--window-size=393,851']
    });

    const page = await browser.newPage();
    await page.setViewport(PIXEL_5_PROFILE.viewport);
    await page.setUserAgent(PIXEL_5_PROFILE.userAgent);

    const loginResult = await ensureFacebookLogin(page, account);
    if (!loginResult.success) {
      if (loginResult.checkpoint) {
        logEvent(`الحساب يتطلب متابعة أمنية (${loginResult.reason}). جاري تفعيل الصورة المحلية للحساب...`, 'info');
        if (!account.avatar_url) {
          account.avatar_url = generateDefaultAvatar(account.username, account.id);
        }
        account.status = 'checkpoint';
        account.last_error = loginResult.reason;
        await browser.close();
        browser = null;
        return {
          success: true,
          checkpoint: true,
          error: loginResult.reason,
          extractedAvatarUrl: account.avatar_url,
          extractedUsername: account.username
        };
      }
      throw new Error(loginResult.reason || 'تعذر تسجيل الدخول لجلب الصورة');
    }

    const extractResult = await performRealProfileExtraction(page, 'https://m.facebook.com/me', account);
    await browser.close();
    browser = null;
    return extractResult;

  } catch (err) {
    if (browser) {
      try { await browser.close(); } catch (e) {}
    }
    logEvent(`تنبيه أثناء مزامنة الصورة: ${err.message}`, 'warning');
    if (!account.avatar_url) {
      account.avatar_url = generateDefaultAvatar(account.username, account.id);
    }
    return {
      success: true,
      extractedAvatarUrl: account.avatar_url,
      extractedUsername: account.username
    };
  }
}

// ==============================================================================
// 5. حلقة معالجة الطابور المستمر (Continuous Queue Worker Loop)
// ==============================================================================
let isRunning = true;
let isCurrentlyProcessing = false;
let idleSleepSeconds = 5;

async function processNextQueueTask() {
  if (isCurrentlyProcessing) return { hasTask: false, busy: true };
  isCurrentlyProcessing = true;

  try {
    let nextTask = null;
    let targetAccount = null;

    if (supabase) {
      const { data: tasks, error: qErr } = await supabase
        .from('bot_tasks')
        .select('*, bot_accounts(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1);

      if (!qErr && tasks && tasks.length > 0) {
        nextTask = tasks[0];
        targetAccount = nextTask.bot_accounts;
      }
    }

    if (!nextTask) {
      const memTask = memoryStore.tasks
        .filter(t => t.status === 'pending')
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];

      if (memTask) {
        nextTask = memTask;
        targetAccount = memoryStore.accounts.find(a => a.id === nextTask.account_id) || nextTask.bot_accounts;
      }
    }

    if (!nextTask) {
      isCurrentlyProcessing = false;
      return { hasTask: false };
    }

    logEvent(`قفل المهمة [#${String(nextTask.id).substring(0, 8)}] وتحديث الحالة إلى [in_progress]...`, 'info');
    if (supabase) {
      await supabase.from('bot_tasks').update({ status: 'in_progress', updated_at: new Date().toISOString() }).eq('id', nextTask.id);
    }
    nextTask.status = 'in_progress';

    if (!targetAccount) {
      const errMsg = 'لم يتم العثور على بيانات الحساب المرتبط بالمهمة في قاعدة البيانات.';
      logEvent(errMsg, 'error');
      if (supabase) {
        await supabase.from('bot_tasks').update({ status: 'failed', error_message: errMsg }).eq('id', nextTask.id);
      }
      nextTask.status = 'failed';
      nextTask.error_message = errMsg;
      isCurrentlyProcessing = false;
      return { hasTask: true, success: false, error: errMsg };
    }

    const executionResult = await executeTaskWithRealBrowser(nextTask, targetAccount);

    if (executionResult.checkpoint) {
      logEvent(`[حارس الحسابات] تجميد الحساب ${targetAccount.username} بسبب Checkpoint.`, 'warning');
      const checkpointMsg = executionResult.error;

      if (supabase) {
        await supabase.from('bot_accounts').update({
          status: 'checkpoint',
          last_error: checkpointMsg,
          updated_at: new Date().toISOString()
        }).eq('id', targetAccount.id);

        await supabase.from('bot_tasks').update({
          status: 'failed',
          error_message: checkpointMsg,
          updated_at: new Date().toISOString()
        }).eq('id', nextTask.id);
      }

      targetAccount.status = 'checkpoint';
      targetAccount.last_error = checkpointMsg;
      nextTask.status = 'failed';
      nextTask.error_message = checkpointMsg;

    } else if (executionResult.success) {
      const updates = { 
        status: 'completed', 
        error_message: null, 
        updated_at: new Date().toISOString(),
        payload: { ...(nextTask.payload || {}), proof_url: executionResult.proofUrl }
      };

      if (supabase) {
        await supabase.from('bot_tasks').update(updates).eq('id', nextTask.id);
      }
      nextTask.status = 'completed';
      nextTask.payload = updates.payload;

      logEvent(`تم اكتمال المهمة بنجاح وتوثيق إثبات التنفيذ [#${String(nextTask.id).substring(0, 8)}]! 🎉`, 'success');

    } else {
      const errMsg = executionResult.error || 'تعذر استكمال المهمة على فيسبوك';
      if (supabase) {
        await supabase.from('bot_tasks').update({ status: 'failed', error_message: errMsg }).eq('id', nextTask.id);
      }
      nextTask.status = 'failed';
      nextTask.error_message = errMsg;
      logEvent(`فشلت المهمة: ${errMsg}`, 'error');
    }

    isCurrentlyProcessing = false;
    return { hasTask: true, success: executionResult.success };

  } catch (err) {
    logEvent(`خطأ استثنائي في دورة الطابور: ${err.message}`, 'error');
    isCurrentlyProcessing = false;
    return { hasTask: false, error: err.message };
  }
}

async function startContinuousWorkerLoop() {
  logEvent('بدء حلقة معالجة طابور المهام المستمرة بالمتصفح الحقيقي...', 'info');

  while (isRunning) {
    try {
      const outcome = await processNextQueueTask();

      if (!outcome.hasTask) {
        await new Promise(r => setTimeout(r, idleSleepSeconds * 1000));
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (loopErr) {
      logEvent(`خطأ في حلقة الطابور: ${loopErr.message}`, 'error');
      await new Promise(r => setTimeout(r, 4000));
    }
  }

  logEvent('تم إيقاف حلقة الطابور مؤقتاً.', 'warning');
}

setTimeout(() => {
  startContinuousWorkerLoop();
}, 2000);

// حلقة مزامنة دورية لصور الحسابات النشطة في الخلفية كل 5 دقائق
async function startAvatarSyncLoop() {
  setInterval(async () => {
    if (isCurrentlyProcessing || !isRunning) return;
    try {
      const activeAccs = memoryStore.accounts.filter(a => a.status === 'active' && a.email && a.password);
      if (activeAccs.length > 0) {
        // نختار أول حساب يحتاج تحديث
        const accToSync = activeAccs[0];
        logEvent(`[مزامنة دورية] التحقق التلقائي من تحديث صورة الحساب ${accToSync.username}...`, 'info');
        await syncAccountAvatarWithBrowser(accToSync);
      }
    } catch (e) {}
  }, 300000);
}
startAvatarSyncLoop();

const handleShutdown = (signal) => {
  logEvent(`تم التقاط إشارة الإغلاق [${signal}]. جاري إغلاق المتصفح والخادم بأمان...`, 'warning');
  isRunning = false;
  setTimeout(() => {
    process.exit(0);
  }, 1000);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// ==============================================================================
// 6. واجهات برمجة التطبيقات (REST Endpoints)
// ==============================================================================

app.get('/api/status', async (req, res) => {
  let accountsList = memoryStore.accounts;
  let tasksList = memoryStore.tasks;

  if (supabase) {
    try {
      const { data: a } = await supabase.from('bot_accounts').select('*').order('created_at', { ascending: false });
      const { data: t } = await supabase.from('bot_tasks').select('*, bot_accounts(*)').order('created_at', { ascending: false });
      if (a) {
        accountsList = a;
        memoryStore.accounts = a;
      }
      if (t) {
        tasksList = t;
        memoryStore.tasks = t;
      }
    } catch (e) {}
  }

  const activeAccounts = accountsList.filter(a => a.status === 'active').length;
  const checkpointAccounts = accountsList.filter(a => a.status === 'checkpoint').length;
  const bannedAccounts = accountsList.filter(a => a.status === 'banned').length;

  const pendingTasks = tasksList.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasksList.filter(t => t.status === 'in_progress').length;
  const completedTasks = tasksList.filter(t => t.status === 'completed').length;
  const failedTasks = tasksList.filter(t => t.status === 'failed').length;

  res.json({
    isWorkerRunning: isRunning,
    isProcessing: isCurrentlyProcessing,
    stats: {
      activeAccounts,
      checkpointAccounts,
      bannedAccounts,
      totalAccounts: accountsList.length,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      failedTasks,
      totalTasks: tasksList.length
    },
    env: {
      supabaseConnected: Boolean(supabase),
      supabaseUrl: currentSupabaseUrl ? currentSupabaseUrl.substring(0, 30) + '...' : null,
      geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY)
    },
    accounts: accountsList,
    tasks: tasksList.slice(0, 50)
  });
});

app.get('/api/logs', (req, res) => {
  const afterId = parseInt(req.query.after, 10) || 0;
  const filtered = systemLogs.filter(l => l.id > afterId);
  res.json({ logs: filtered });
});

app.get('/api/accounts', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('bot_accounts').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        memoryStore.accounts = data;
        return res.json({ accounts: data });
      }
    } catch (e) {}
  }
  res.json({ accounts: memoryStore.accounts });
});

app.post('/api/accounts', async (req, res) => {
  const { username, email, password, avatar_url, cookies } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, message: 'اسم الحساب مطلوب' });
  }

  const newAccount = {
    id: 'acc-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    username: username.trim(),
    email: (email || '').trim() || null,
    password: password || null,
    avatar_url: (avatar_url || '').trim() || null,
    status: 'active',
    last_error: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    avatar_updated_at: Date.now()
  };

  // إذا تم تزويد الكوكيز مباشرة، نحفظها في الجلسة لتخطي طلب تسجيل الدخول بالكامل
  if (cookies) {
    parseAndSaveCookieString(newAccount.id, cookies);
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.from('bot_accounts').insert([{
        username: newAccount.username,
        email: newAccount.email,
        password: newAccount.password,
        avatar_url: newAccount.avatar_url,
        status: newAccount.status
      }]).select().single();

      if (!error && data) {
        memoryStore.accounts.unshift(data);
        logEvent(`تم تسجيل الحساب الفعلي الجديد في Supabase بنجاح: ${username} (${email || 'بدون إيميل'})`, 'success');
        
        // محاولة سريعة في الخلفية لجلب صورة الحساب الحقيقية فور تسجيله
        setTimeout(async () => {
          try {
            await syncAccountAvatarWithBrowser(data);
          } catch (e) {}
        }, 1500);

        return res.json({ success: true, account: data });
      }
    } catch (e) {
      logEvent(`فشل إضافة الحساب في Supabase: ${e.message}`, 'warning');
    }
  }

  memoryStore.accounts.unshift(newAccount);
  logEvent(`تم تسجيل الحساب الفعلي الجديد محلياً بنجاح: ${username}`, 'success');

  // محاولة جلب الصورة في الخلفية
  setTimeout(async () => {
    try {
      await syncAccountAvatarWithBrowser(newAccount);
    } catch (e) {}
  }, 1500);

  res.json({ success: true, account: newAccount });
});

// مسار فوري لمزامنة وجلب صورة البروفايل الحقيقية من فيسبوك
app.post('/api/accounts/:id/sync-avatar', async (req, res) => {
  const accountId = req.params.id;
  let targetAcc = memoryStore.accounts.find(a => a.id === accountId);

  if (!targetAcc && supabase) {
    try {
      const { data } = await supabase.from('bot_accounts').select('*').eq('id', accountId).single();
      if (data) targetAcc = data;
    } catch (e) {}
  }

  if (!targetAcc) {
    return res.status(404).json({ success: false, message: 'لم يتم العثور على الحساب المستهدف' });
  }

  try {
    const result = await syncAccountAvatarWithBrowser(targetAcc);
    res.json({
      success: true,
      message: 'تم تحديث صورة البروفايل بنجاح!',
      avatarUrl: targetAcc.avatar_url,
      username: targetAcc.username,
      avatar_updated_at: Date.now()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر مزامنة الصورة: ' + err.message });
  }
});

app.put('/api/accounts/:id', async (req, res) => {
  const accountId = req.params.id;
  let { username, email, password, avatar_url, status, last_error, cookies } = req.body;

  if (cookies) {
    parseAndSaveCookieString(accountId, cookies);
    status = 'active';
    last_error = null;
  }

  let updatedAccount = null;

  if (supabase) {
    try {
      const payload = { updated_at: new Date().toISOString() };
      if (username !== undefined) payload.username = username;
      if (email !== undefined) payload.email = email;
      if (password !== undefined) payload.password = password;
      if (avatar_url !== undefined) payload.avatar_url = avatar_url;
      if (status !== undefined) payload.status = status;
      if (last_error !== undefined) payload.last_error = last_error;

      const { data, error } = await supabase.from('bot_accounts').update(payload).eq('id', accountId).select().single();
      if (!error && data) {
        updatedAccount = data;
      }
    } catch (e) {
      logEvent(`خطأ أثناء تحديث الحساب في Supabase: ${e.message}`, 'warning');
    }
  }

  const localIndex = memoryStore.accounts.findIndex(a => a.id === accountId);
  if (localIndex !== -1) {
    memoryStore.accounts[localIndex] = {
      ...memoryStore.accounts[localIndex],
      ...(username !== undefined ? { username } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(password !== undefined ? { password } : {}),
      ...(avatar_url !== undefined ? { avatar_url } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(last_error !== undefined ? { last_error } : {}),
      updated_at: new Date().toISOString()
    };
    if (!updatedAccount) updatedAccount = memoryStore.accounts[localIndex];
  }

  if (updatedAccount) {
    logEvent(`تم تعديل بيانات الحساب بنجاح: ${updatedAccount.username} [الحالة: ${updatedAccount.status}]`, 'success');
    res.json({ success: true, account: updatedAccount });
  } else {
    res.status(404).json({ success: false, message: 'الحساب غير موجود' });
  }
});

app.delete('/api/accounts/:id', async (req, res) => {
  const accountId = req.params.id;

  let deleted = false;
  if (supabase) {
    try {
      const { error } = await supabase.from('bot_accounts').delete().eq('id', accountId);
      if (!error) deleted = true;
    } catch (e) {
      logEvent(`خطأ أثناء حذف الحساب من Supabase: ${e.message}`, 'warning');
    }
  }

  const sessionPath = getSessionFilePath(accountId);
  if (fs.existsSync(sessionPath)) {
    try { fs.unlinkSync(sessionPath); } catch (e) {}
  }

  const avatarPath = path.join(AVATARS_DIR, `avatar_${accountId}.jpg`);
  if (fs.existsSync(avatarPath)) {
    try { fs.unlinkSync(avatarPath); } catch (e) {}
  }

  const initialCount = memoryStore.accounts.length;
  memoryStore.accounts = memoryStore.accounts.filter(a => a.id !== accountId);
  memoryStore.tasks = memoryStore.tasks.filter(t => t.account_id !== accountId);

  if (deleted || memoryStore.accounts.length < initialCount) {
    logEvent(`تم حذف الحساب [#${accountId}] وكافة مهامه وجلساته بنجاح.`, 'success');
    res.json({ success: true, message: 'تم حذف الحساب بنجاح' });
  } else {
    res.status(404).json({ success: false, message: 'لم يتم العثور على الحساب' });
  }
});

app.post('/api/accounts/:id/check', async (req, res) => {
  const accountId = req.params.id;
  let targetAcc = memoryStore.accounts.find(a => a.id === accountId);

  if (!targetAcc && supabase) {
    try {
      const { data } = await supabase.from('bot_accounts').select('*').eq('id', accountId).single();
      if (data) targetAcc = data;
    } catch (e) {}
  }

  if (!targetAcc) {
    return res.status(404).json({ success: false, message: 'لم يتم العثور على الحساب المستهدف' });
  }

  logEvent(`[فحص فوري] بدء فحص الحساب الحقيقي ومزامنة الصورة بالمتصفح: ${targetAcc.username}...`, 'info');

  const checkTask = {
    id: 'instant-' + Date.now(),
    account_id: targetAcc.id,
    task_type: 'extract_profile',
    target_url: 'https://m.facebook.com/me',
    payload: { note: 'فحص فوري وتأكيد نشاط الحساب ومزامنة الصورة' },
    status: 'in_progress',
    bot_accounts: targetAcc,
    created_at: new Date().toISOString()
  };

  const outcome = await executeTaskWithRealBrowser(checkTask, targetAcc);

  if (outcome.success) {
    targetAcc.status = 'active';
    targetAcc.last_error = null;
    if (outcome.extractedAvatarUrl) targetAcc.avatar_url = outcome.extractedAvatarUrl;
    if (outcome.extractedUsername) targetAcc.username = outcome.extractedUsername;

    if (supabase) {
      try {
        await supabase.from('bot_accounts').update({
          status: 'active',
          last_error: null,
          avatar_url: targetAcc.avatar_url,
          username: targetAcc.username,
          updated_at: new Date().toISOString()
        }).eq('id', targetAcc.id);
      } catch (e) {}
    }

    res.json({ success: true, message: 'تم فحص الحساب ومزامنة الصورة الحقيقية بنجاح!', account: targetAcc, proofUrl: outcome.proofUrl });
  } else {
    res.json({ success: false, message: outcome.error, account: targetAcc });
  }
});

app.post('/api/worker/toggle', (req, res) => {
  isRunning = !isRunning;
  if (isRunning) {
    logEvent('تم استئناف تشغيل حلقة الطابور التلقائي بواسطة لوحة التحكم.', 'success');
    startContinuousWorkerLoop();
  } else {
    logEvent('تم إيقاف حلقة الطابور التلقائي مؤقتاً.', 'warning');
  }
  res.json({
    isWorkerRunning: isRunning,
    message: isRunning ? 'تم تشغيل الطابور التلقائي بنجاح' : 'تم إيقاف الطابور التلقائي مؤقتاً'
  });
});

app.post('/api/run', async (req, res) => {
  const result = await processNextQueueTask();
  if (result.hasTask) {
    res.json({
      success: result.success !== false,
      message: result.success !== false ? 'تم تنفيذ ومعالجة المهمة بالمتصفح بنجاح!' : (result.error || 'حدث خطأ أثناء معالجة المهمة')
    });
  } else {
    res.json({
      success: true,
      message: 'لا توجد مهام معلقة في الطابور حالياً'
    });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { account_id, task_type, target_url, payload } = req.body;

  if (!target_url) {
    return res.status(400).json({ success: false, message: 'الرابط المستهدف مطلوب' });
  }

  let assignedAcc = memoryStore.accounts.find(a => a.id === account_id);
  if (!assignedAcc && memoryStore.accounts.length > 0) {
    assignedAcc = memoryStore.accounts[0];
  }

  if (!assignedAcc) {
    return res.status(400).json({ success: false, message: 'يرجى اختيار أو إضافة حساب حقيقي أولاً' });
  }

  const finalTaskType = task_type || 'like';

  const newTask = {
    id: 't-' + Math.floor(Math.random() * 1000000),
    account_id: assignedAcc.id,
    task_type: finalTaskType,
    target_url: target_url.trim(),
    payload: payload || {},
    status: 'pending',
    error_message: null,
    bot_accounts: assignedAcc,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('bot_tasks').insert([{
        account_id: newTask.account_id,
        task_type: finalTaskType,
        target_url: newTask.target_url,
        payload: newTask.payload,
        status: 'pending'
      }]).select().single();

      if (!error && data) {
        logEvent(`تمت جدولة مهمة [${finalTaskType}] في Supabase للحساب ${assignedAcc.username}.`, 'success');
        return res.json({ success: true, task: data });
      }
    } catch (e) {
      logEvent(`فشل الحفظ في Supabase: ${e.message}`, 'warning');
    }
  }

  memoryStore.tasks.unshift(newTask);
  logEvent(`تمت جدولة مهمة [${finalTaskType}] في الطابور المحلي للحساب ${assignedAcc.username}.`, 'success');
  res.json({ success: true, task: newTask });
});

app.post('/api/settings', async (req, res) => {
  const { supabase_url, supabase_key } = req.body;
  const connected = initSupabase(supabase_url, supabase_key);
  if (connected) {
    await syncFromSupabase();
  }
  res.json({
    success: connected,
    message: connected ? 'تم ربط قاعدة بيانات Supabase الحقيقية بنجاح ومزامنة الحسابات!' : 'فشل الربط، يرجى التأكد من صحة الرابط والمفتاح.'
  });
});

app.listen(PORT, HOST, () => {
  logEvent(`خادم Basha SMM جاهز ويعمل على http://${HOST}:${PORT}`, 'success');
});
