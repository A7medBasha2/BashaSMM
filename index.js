import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import WebSocket from 'ws';

// الاتصال بـ Supabase باستخدام الـ Secrets مع دعم الـ WebSocket لبيئة Node 20
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
    realtime: { transport: WebSocket }
});

// تهيئة عقل الـ AI باستخدام مفتاح Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function runBotAgent() {
    console.log("🤖 جاري فحص المهام والحسابات المعلقة في قاعدة البيانات...");

    // جلب المهام المعلقة مع بيانات الأكونت والبصمة ومحاكاة الموبايل الخاصة به
    let { data: tasks, error } = await supabase
        .from('bot_tasks')
        .select('*, bot_accounts(*)')
        .eq('status', 'pending')
        .limit(1);

    if (error) {
        console.error("❌ خطأ أثناء جلب المهام:", error.message);
        return;
    }

    if (!tasks || tasks.length === 0) {
        console.log("📭 لا توجد مهام معلقة حالياً. النظام في انتظار تكليف جديد.");
        return;
    }

    const task = tasks[0];
    const account = task.bot_accounts;

    console.log(`🎯 تم العثور على مهمة: [${task.action_type}] للهدف: ${task.target_url}`);
    if (account) {
        console.log(`👤 الأكونت المنفذ: ${account.account_name} | جهاز المحاكاة (Anti-detect): ${account.device_type}`);
    } else {
        console.log("⚠️ تنبيه: هذه المهمة غير مرتبطة بأكونت محدد!");
    }

    // تحديث حالة المهمة إلى "جاري التنفيذ" (running)
    await supabase
        .from('bot_tasks')
        .update({ status: 'running' })
        .eq('id', task.id);

    // استخدام Gemini لتوليد المحتوى أو خطة التنفيذ البشرية بناءً على سياق الموبايل
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `أنت مساعد أتمتة ذكي لـ SMM مع حماية ضد الحظر (Anti-detect). قم بتحليل المهمة وجهز الرد أو التعليق البشري الواقعي:
        نوع المهمة: ${task.action_type}
        الرابط المستهدف: ${task.target_url}
        بيانات الحساب ومحاكاة الجهاز: ${JSON.stringify(account)}
        تعليمات إضافية: ${task.ai_context || 'تفاعل بشكل طبيعي وبشري تماماً'}`
    });

    console.log("🧠 خطة الذكاء الاصطناعي المولدة:");
    console.log(response.text);

    // تحديث المهمة إلى مكتملة (completed)
    await supabase
        .from('bot_tasks')
        .update({ status: 'completed' })
        .eq('id', task.id);

    console.log("✅ تم تنفيذ المهمة بنجاح وتحديث حالتها في القاعدة!");
}

runBotAgent();
