import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// الاتصال بـ Supabase باستخدام الـ Secrets
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// تهيئة عقل الـ AI باستخدام مفتاح Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function runBotAgent() {
    console.log("🤖 جاري فحص المهام الجديدة في جدول bot_tasks...");

    // جلب المهام المعلقة (pending) من قاعدة البيانات
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
        console.log("📭 لا توجد مهام معلقة حالياً.");
        return;
    }

    const task = tasks[0];
    console.log(`🎯 تم العثور على مهمة جديدة: ${task.action_type} للهدف: ${task.target_url}`);

    // تحديث حالة المهمة إلى "جاري التنفيذ" (running)
    await supabase
        .from('bot_tasks')
        .update({ status: 'running' })
        .eq('id', task.id);

    // استخدام Gemini لتوليد الرد أو خطة التنفيذ الذكية للمهمة
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `أنت مساعد أتمتة لـ SMM. قم بتحليل هذه المهمة وجهز الخطوات التنفيذية لها:
        نوع المهمة: ${task.action_type}
        الرابط المستهدف: ${task.target_url}
        بيانات الأكونت المرتبط: ${JSON.stringify(task.bot_accounts)}`,
    });

    console.log("🧠 خطة الذكاء الاصطناعي للمهمة:");
    console.log(response.text);

    // تحديث المهمة إلى مكتملة (completed)
    await supabase
        .from('bot_tasks')
        .update({ status: 'completed' })
        .eq('id', task.id);

    console.log("✅ تم تنفيذ المهمة وتحديث حالتها بنجاح!");
}

runBotAgent();
