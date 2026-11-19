import { config, fields, collection, singleton } from '@keystatic/core';
import { BrandMark } from './src/admin/PublishButton';

/**
 * Admin-Oberfläche (auf Arabisch) für Speisekarte und Restaurantdaten.
 * Start: `npm run admin` → http://localhost:4321/keystatic
 * Änderungen landen als JSON in src/content/ und Bilder in src/assets/images/.
 * Der Button „نشر على الإنترنت“ (unten links) macht git commit + push → GitHub Pages baut die Seite neu.
 */

const ALLERGENS = [
  { label: 'A – غلوتين (Gluten)', value: 'A' },
  { label: 'B – قشريات (Krebstiere)', value: 'B' },
  { label: 'C – بيض (Ei)', value: 'C' },
  { label: 'D – سمك (Fisch)', value: 'D' },
  { label: 'E – فول سوداني (Erdnüsse)', value: 'E' },
  { label: 'F – صويا (Soja)', value: 'F' },
  { label: 'G – حليب / لاكتوز (Milch)', value: 'G' },
  { label: 'H – مكسرات (Nüsse)', value: 'H' },
  { label: 'L – كرفس (Sellerie)', value: 'L' },
  { label: 'M – خردل (Senf)', value: 'M' },
  { label: 'N – سمسم (Sesam)', value: 'N' },
  { label: 'O – كبريتات (Sulfite)', value: 'O' },
  { label: 'P – ترمس (Lupinen)', value: 'P' },
  { label: 'R – رخويات (Weichtiere)', value: 'R' },
];

const dish = fields.object({
  name: fields.text({ label: 'الاسم (ألماني)', validation: { isRequired: true } }),
  description: fields.text({ label: 'الوصف (ألماني)', multiline: true }),
  image: fields.image({
    label: 'صورة الصنف',
    description: 'تظهر بجانب الصنف وتأخذ نصف المساحة. أي حجم مقبول – يتم تصغيرها وتحسينها تلقائياً عند النشر. بدون صورة = تظهر صورة القسم.',
    directory: 'src/assets/images/dishes',
    publicPath: '/src/assets/images/dishes/',
  }),
  model3d: fields.file({
    label: 'نموذج ثلاثي الأبعاد (AR) – GLB',
    description: 'اختياري: مسح ثلاثي الأبعاد حقيقي للطبق (مثلاً من تطبيق Polycam، تصدير GLB بالحجم الحقيقي). بدونه يُنشأ طبق تلقائياً من الصورة.',
    directory: 'public/ar/scans',
    publicPath: '/ar/scans/',
    validation: { isRequired: false },
  }),
  model3dIos: fields.file({
    label: 'نموذج AR للآيفون – USDZ (اختياري)',
    description: 'غير ضروري عادةً – يُنشأ تلقائياً من ملف GLB.',
    directory: 'public/ar/scans',
    publicPath: '/ar/scans/',
    validation: { isRequired: false },
  }),
  price: fields.text({ label: 'السعر باليورو', description: 'مثال: 13,50', validation: { isRequired: true } }),
  size: fields.text({ label: 'الكمية / الحصة', description: 'مثال: 0,3 l أو 150 g (اختياري)' }),
  price2: fields.text({ label: 'سعر ثانٍ (اختياري)', description: 'لحجم ثانٍ، مثال: 6,10' }),
  size2: fields.text({ label: 'كمية ثانية (اختياري)', description: 'مثال: 0,5 l' }),
  allergens: fields.multiselect({ label: 'مسببات الحساسية', options: ALLERGENS }),
  tags: fields.multiselect({
    label: 'خصائص',
    options: [
      { label: 'نباتي (Vegetarisch)', value: 'vegetarian' },
      { label: 'نباتي صرف (Vegan)', value: 'vegan' },
      { label: 'حار (Scharf)', value: 'spicy' },
    ],
  }),
  recommended: fields.checkbox({ label: '⭐ توصية المطعم' }),
  soldOut: fields.checkbox({ label: '⛔ نفد (ausverkauft)' }),
  hidden: fields.checkbox({ label: '🙈 إخفاء من الموقع' }),
  name_en: fields.text({ label: 'الاسم (إنجليزي)', description: 'فارغ = الاسم الألماني' }),
  description_en: fields.text({ label: 'الوصف (إنجليزي)', multiline: true }),
  name_nl: fields.text({ label: 'الاسم (هولندي)', description: 'فارغ = الاسم الإنجليزي' }),
  description_nl: fields.text({ label: 'الوصف (هولندي)', multiline: true }),
  group: fields.text({
    label: 'عنوان فرعي (ألماني، اختياري)',
    description: 'مثال: "Limonaden". الأصناف بنفس العنوان الفرعي تُجمع معاً.',
  }),
  group_en: fields.text({ label: 'عنوان فرعي (إنجليزي)' }),
  group_nl: fields.text({ label: 'عنوان فرعي (هولندي)' }),
});

const siteImage = (label: string) =>
  fields.image({ label, directory: 'src/assets/images/site', publicPath: '/src/assets/images/site/' });

export default config({
  storage: { kind: 'local' },
  locale: 'ar-AE',
  ui: {
    brand: { name: 'فينيسيا – لوحة التحكم', mark: BrandMark },
    navigation: {
      'قائمة الطعام': ['categories'],
      'المطعم': ['site'],
    },
  },
  collections: {
    categories: collection({
      label: 'الأقسام والأصناف',
      path: 'src/content/menu/*',
      slugField: 'name',
      format: { data: 'json' },
      columns: ['order'],
      schema: {
        name: fields.slug({ name: { label: 'اسم القسم (ألماني)' }, slug: { label: 'اسم الملف (تلقائي)' } }),
        name_en: fields.text({ label: 'اسم القسم (إنجليزي)' }),
        name_nl: fields.text({ label: 'اسم القسم (هولندي)' }),
        order: fields.integer({
          label: 'الترتيب',
          description: 'رقم أصغر = أعلى في الصفحة (10، 20، 30 … يترك مجالاً للإضافة بينها)',
          defaultValue: 100,
        }),
        hidden: fields.checkbox({ label: 'إخفاء القسم' }),
        kind: fields.select({
          label: 'النوع',
          options: [
            { label: 'مأكولات', value: 'food' },
            { label: 'مشروبات', value: 'drinks' },
          ],
          defaultValue: 'food',
        }),
        image: fields.image({
          label: 'صورة القسم (اختياري)',
          description: 'تظهر أعلى القسم، وأيضاً بجانب كل صنف ليس له صورة خاصة.',
          directory: 'src/assets/images/categories',
          publicPath: '/src/assets/images/categories/',
        }),
        note: fields.text({ label: 'ملاحظة (ألماني، اختياري)', description: 'مثال: "Alle Pizzen enthalten A, C, F, G, P"' }),
        note_en: fields.text({ label: 'ملاحظة (إنجليزي)' }),
        note_nl: fields.text({ label: 'ملاحظة (هولندي)' }),
        dishes: fields.array(dish, {
          label: 'الأصناف / المشروبات',
          itemLabel: (props) => {
            const v = props.fields;
            const flags = [v.soldOut.value ? '⛔' : '', v.recommended.value ? '⭐' : '', v.hidden.value ? '🙈' : '', v.image.value ? '📷' : ''].join('');
            return `${flags} ${v.name.value || 'صنف جديد'} – ${v.price.value || '?'} €`.trim();
          },
        }),
      },
    }),
  },
  singletons: {
    site: singleton({
      label: 'بيانات المطعم (العنوان، الهاتف، واتساب، الأوقات …)',
      path: 'src/content/site',
      format: { data: 'json' },
      schema: {
        name: fields.text({ label: 'اسم المطعم', validation: { isRequired: true } }),
        subtitle: fields.text({ label: 'عنوان فرعي', description: 'مثال: Pizzeria · Restaurant' }),
        tagline: fields.text({ label: 'الشعار (ألماني)' }),
        tagline_en: fields.text({ label: 'الشعار (إنجليزي)' }),
        tagline_nl: fields.text({ label: 'الشعار (هولندي)' }),
        url: fields.url({ label: 'عنوان الموقع', description: 'مثال: https://www.venezia-pizzeria.at' }),
        street: fields.text({ label: 'الشارع ورقم المبنى' }),
        zip: fields.text({ label: 'الرمز البريدي' }),
        city: fields.text({ label: 'المدينة' }),
        country: fields.text({ label: 'رمز الدولة', defaultValue: 'AT' }),
        phone: fields.text({ label: 'الهاتف', description: 'دولي، مثال: +43 463 123456' }),
        whatsapp: fields.text({
          label: 'رقم واتساب للحجوزات',
          description: 'أرقام فقط، مع رمز الدولة، بدون + وبدون مسافات. مثال: 436641234567',
          validation: { isRequired: true, pattern: { regex: /^[1-9][0-9]{7,14}$/, message: 'أرقام فقط، مثال: 436641234567' } },
        }),
        email: fields.text({ label: 'البريد الإلكتروني (لصفحة Impressum)' }),
        googleMapsUrl: fields.url({ label: 'رابط خرائط Google (الاتجاهات)', description: 'فارغ = يُنشأ من العنوان' }),
        googleReviewUrl: fields.url({ label: 'رابط „قيّمنا على Google"' }),
        instagram: fields.url({ label: 'Instagram (اختياري)' }),
        facebook: fields.url({ label: 'Facebook (اختياري)' }),
        timezone: fields.text({ label: 'المنطقة الزمنية', defaultValue: 'Europe/Vienna' }),
        openingHours: fields.array(
          fields.object({
            day: fields.select({
              label: 'اليوم',
              options: [
                { label: 'الاثنين', value: 'mo' },
                { label: 'الثلاثاء', value: 'tu' },
                { label: 'الأربعاء', value: 'we' },
                { label: 'الخميس', value: 'th' },
                { label: 'الجمعة', value: 'fr' },
                { label: 'السبت', value: 'sa' },
                { label: 'الأحد', value: 'su' },
              ],
              defaultValue: 'mo',
            }),
            open: fields.text({ label: 'يفتح (HH:MM)', defaultValue: '11:00' }),
            close: fields.text({ label: 'يغلق (HH:MM)', defaultValue: '22:00' }),
          }),
          {
            label: 'أوقات العمل',
            description: 'سطر لكل يوم (سطران عند وجود استراحة ظهر). يوم بدون سطر = يوم عطلة.',
            itemLabel: (p) => `${p.fields.day.value}: ${p.fields.open.value}–${p.fields.close.value}`,
          }
        ),
        hoursNote: fields.text({ label: 'ملاحظة عن الأوقات (ألماني، اختياري)', description: 'مثال: Küche bis 21:30' }),
        hoursNote_en: fields.text({ label: 'ملاحظة عن الأوقات (إنجليزي)' }),
        hoursNote_nl: fields.text({ label: 'ملاحظة عن الأوقات (هولندي)' }),
        reservationTemplate: fields.text({
          label: 'نص رسالة واتساب للحجز (ألماني)',
          multiline: true,
          description: 'المتغيرات: {name} {persons} {date} {time} {note}',
        }),
        reservationTemplate_en: fields.text({ label: 'نص رسالة واتساب (إنجليزي)', multiline: true }),
        reservationTemplate_nl: fields.text({ label: 'نص رسالة واتساب (هولندي)', multiline: true }),
        about: fields.text({ label: 'من نحن (ألماني)', multiline: true }),
        about_en: fields.text({ label: 'من نحن (إنجليزي)', multiline: true }),
        about_nl: fields.text({ label: 'من نحن (هولندي)', multiline: true }),
        logo: siteImage('الشعار (Logo)'),
        heroImage: siteImage('الصورة الكبيرة في الأعلى'),
        aboutImage: siteImage('صورة „من نحن"'),
        gallery: fields.array(
          fields.object({
            image: fields.image({ label: 'صورة', directory: 'src/assets/images/gallery', publicPath: '/src/assets/images/gallery/' }),
            alt: fields.text({ label: 'وصف الصورة (ألماني، للمكفوفين و Google)' }),
          }),
          { label: 'معرض الصور', itemLabel: (p) => p.fields.alt.value || 'صورة' }
        ),
        colorBrand: fields.text({ label: 'اللون الرئيسي (بني إسبريسو)', defaultValue: '#2b1a12' }),
        colorAccent: fields.text({ label: 'لون التمييز (ذهبي)', defaultValue: '#c49a52' }),
        colorHighlight: fields.text({ label: 'لون الإبراز (تيراكوتا)', defaultValue: '#a8432a' }),
        legalOwner: fields.text({ label: 'Impressum: المالك / الشركة' }),
        legalForm: fields.text({ label: 'Impressum: الشكل القانوني', description: 'مثال: Einzelunternehmen, GmbH' }),
        legalUid: fields.text({ label: 'Impressum: الرقم الضريبي UID' }),
        legalRegister: fields.text({ label: 'Impressum: رقم السجل التجاري (إن وجد)' }),
        legalChamber: fields.text({ label: 'Impressum: الغرفة', defaultValue: 'Wirtschaftskammer Salzburg, Fachgruppe Gastronomie' }),
        legalAuthority: fields.text({ label: 'Impressum: جهة الترخيص' }),
        legalTrade: fields.text({ label: 'Impressum: النشاط', defaultValue: 'Gastgewerbe (Betriebsart Restaurant)' }),
      },
    }),
  },
});
