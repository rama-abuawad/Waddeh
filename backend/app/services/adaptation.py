from app.schemas import AdaptationStrategy, SimplificationLevel


LEVEL_LABELS_AR = {
    SimplificationLevel.very_easy: "مبتدئ / سهل جداً",
    SimplificationLevel.easy: "سهل",
    SimplificationLevel.standard: "متوسط",
    SimplificationLevel.advanced: "متقدم",
    SimplificationLevel.original: "كما ورد",
}


def build_adaptation_strategy(level: SimplificationLevel) -> AdaptationStrategy:
    if level == SimplificationLevel.very_easy:
        return AdaptationStrategy(
            target_level=level,
            target_level_label=LEVEL_LABELS_AR[level],
            vocabulary_control="استخدم كلمات شائعة جداً واشرح الكلمات التي لا يمكن حذفها.",
            sentence_control="اجعل كل جملة قصيرة وتحمل فكرة واحدة.",
            explanation_control="أضف دعماً تعليمياً مباشراً وقليلاً داخل الأدوات لا داخل النص.",
            terminology_policy="استبدل المصطلحات الصعبة مؤقتاً، ثم أعد تقديمها في مسار التدرّج.",
        )
    if level == SimplificationLevel.easy:
        return AdaptationStrategy(
            target_level=level,
            target_level_label=LEVEL_LABELS_AR[level],
            vocabulary_control="استخدم عربية فصحى مألوفة وأبق المصطلحات المهمة عند الحاجة.",
            sentence_control="قسّم التراكيب الطويلة إلى جمل قصيرة أو متوسطة.",
            explanation_control="قدّم توضيحاً موجزاً للمفردات والاختلافات المهمة.",
            terminology_policy="أعد تقديم بعض كلمات المصدر عندما تساعد المتعلم على التقدم.",
        )
    if level == SimplificationLevel.standard:
        return AdaptationStrategy(
            target_level=level,
            target_level_label=LEVEL_LABELS_AR[level],
            vocabulary_control="حافظ على مفردات عربية فصحى طبيعية مع شرح غير المألوف.",
            sentence_control="خفف التعقيد فقط عندما يعيق الفهم.",
            explanation_control="اجعل الدعم التعليمي مختصراً وموجهاً للفروق المهمة.",
            terminology_policy="حافظ على المصطلحات المركزية مع ربطها بمرادفات أبسط.",
        )
    if level == SimplificationLevel.advanced:
        return AdaptationStrategy(
            target_level=level,
            target_level_label=LEVEL_LABELS_AR[level],
            vocabulary_control="اقترب من مفردات المصدر ولا تستبدل إلا العبارات المربكة.",
            sentence_control="حافظ على الأسلوب الرسمي مع توضيح البنية عند الحاجة.",
            explanation_control="ركز الدعم على الفروق الدقيقة لا على الشرح الأساسي.",
            terminology_policy="أبق مصطلحات المصدر ما لم تسبب لبساً واضحاً.",
        )
    return AdaptationStrategy(
        target_level=level,
        target_level_label=LEVEL_LABELS_AR[level],
        vocabulary_control="لا تغيّر مفردات المصدر.",
        sentence_control="لا تغيّر بنية النص.",
        explanation_control="قدّم أدوات تعلم حول النص كما ورد فقط.",
        terminology_policy="حافظ على جميع المصطلحات كما وردت.",
    )
