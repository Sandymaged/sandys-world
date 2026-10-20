// الترجمة الإنجليزي للبيانات التجريبية (بالـ slug). في قاعدة البيانات دي بتبقى عمود en (jsonb).
import type { Localized } from "./types";

export const partnersEn: Record<string, Localized & { story?: string; city?: string }> = {
  "noon-workshop": { name: "Noon Workshop", tagline: "Leather and crochet, hand-made in Assiut", story: "A small workshop that started in a bedroom, making hand-stitched leather journals and crochet keychains. Every piece takes its time.", city: "Assiut" },
  "saeed-naturals": { name: "Saeed Naturals", tagline: "Soap and herbs from Upper Egypt", story: "Cold-process olive oil soap and herbal tea blends from the family's spice shop.", city: "Abnub" },
  "print-with-love": { name: "Print with Love", tagline: "Your name on anything", story: "A small print studio for mugs, cushions and frames. They send you the design to approve first.", city: "Assiut" },
  "nour-candles": { name: "Nour Candles", tagline: "Soy candles that smell like home", story: "Hand-poured soy candles in reusable jars, with scents for every season.", city: "New Assiut" },
  "garden-roses": { name: "Garden Roses", tagline: "Fresh flowers arranged every morning", story: "A family flower shop in the heart of Assiut. Flowers arrive every morning and are arranged in front of you.", city: "Assiut" },
  "mira-treats": { name: "Mira Treats", tagline: "Chocolate and nuts with a homemade touch", story: "Belgian chocolate shaped in a small kitchen, and nuts roasted to order.", city: "Manfalut" },
  "wood-carve": { name: "Wood & Carve", tagline: "Laser engraving on natural wood", story: "A wood workshop engraving names and dates on natural wood keychains and frames.", city: "Assiut" },
  "little-stitch": { name: "Little Stitch", tagline: "Embroidery and gifts for new babies", story: "A mom who embroiders babies' names on cotton blankets, with soft teddy bears to match.", city: "Dayrout" },
};

export const occasionsEn: Record<string, Localized> = {
  birthday: { name: "Birthday" },
  success: { name: "Graduation" },
  newborn: { name: "New baby" },
  "get-well": { name: "Get well" },
  "mothers-day": { name: "Mother's Day" },
  engagement: { name: "Engagement" },
  thanks: { name: "Thank you" },
  ramadan: { name: "Ramadan & Eid" },
  christmas: { name: "Christmas" },
};

export const productsEn: Record<string, Localized> = {
  "name-mug": { name: "Personalised name mug", description: "A white ceramic mug printed with a name or a short line of your choice.", category: "Mugs" },
  "scented-candle": { name: "Scented candle jar", description: "Vanilla and oud soy candle, burns for about 30 hours.", category: "Candles" },
  "rose-bouquet": { name: "Fresh rose bouquet", description: "A wrapped bouquet of 12 fresh roses.", category: "Flowers" },
  "single-rose": { name: "Single fresh rose", description: "One rose, wrapped and tied with a ribbon.", category: "Flowers" },
  "chocolate-box": { name: "Luxury chocolate box", description: "16 Belgian chocolates with assorted fillings.", category: "Chocolate" },
  "helium-balloon": { name: "Helium balloon", description: "A helium balloon printed for the occasion.", category: "Balloons" },
  "engraved-keychain": { name: "Engraved wooden keychain", description: "Natural wood keychain engraved with a name or a date.", category: "Keychains" },
  "printed-cushion": { name: "Printed cushion", description: "40×40 velvet cushion printed with your words.", category: "Home" },
  "leather-notebook": { name: "Handmade leather journal", description: "Hand-stitched genuine leather journal, 120 pages.", category: "Stationery" },
  "crochet-keychain": { name: "Crochet keychain", description: "Hand-made crochet keychain in different shapes.", category: "Keychains" },
  "soap-set": { name: "Natural soap set", description: "3 natural soaps with olive oil and lavender.", category: "Self-care" },
  "teddy-bear": { name: "Velvet teddy bear", description: "A soft 35 cm velvet teddy bear.", category: "Toys" },
  "nuts-box": { name: "Mixed nuts box", description: "Half a kilo of roasted nuts in a gift box.", category: "Treats" },
  "photo-frame": { name: "Printed photo frame", description: "A 20×25 wooden frame with the photo you send us.", category: "Home" },
  "christmas-ornaments": { name: "Christmas ornament set", description: "6 gold and red tree ornaments.", category: "Decor" },
  "baby-blanket": { name: "Embroidered baby blanket", description: "A soft cotton blanket embroidered with the baby's name.", category: "Baby" },
  "herbal-tea": { name: "Herbal tea box", description: "4 herbal teas in a wooden box.", category: "Treats" },
};

export const packagesEn: Record<string, Localized> = {
  "birthday-latif": { name: "Happy Birthday", description: "A name mug, chocolates and a balloon: a sweet start to a lovely day." },
  "birthday-momayaz": { name: "Birthday Deluxe", description: "Fresh roses, a scented candle and chocolates in one box." },
  "get-well-soon": { name: "Get Well Soon", description: "Herbal tea, nuts and a rose, so they know you're there." },
  "success-box": { name: "Congrats Grad", description: "A handmade leather journal, an engraved keychain and chocolates." },
  "newborn-welcome": { name: "Welcome Baby", description: "A blanket embroidered with the baby's name, a teddy bear and a balloon." },
  "for-mom": { name: "For the Best Mom", description: "A printed cushion, natural soaps and a rose bouquet." },
  "student-budget": { name: "Student Treat", description: "A crochet keychain, a rose and chocolates, easy on the budget." },
  "christmas-joy": { name: "Christmas Joy", description: "Tree ornaments, a scented candle and chocolates." },
  "christmas-family": { name: "Holiday Table", description: "Nuts, chocolates, a candle and ornaments: a gift for the whole home." },
};

export const kitsEn: Record<string, Localized> = {
  "paint-hairbrush": {
    name: "Paint-your-hairbrush kit", tagline: "Everyone paints her own brush",
    description: "A natural wooden brush and comb to paint with your friends. Each kit comes in a cotton bag with a bow and a name card.",
    contents: ["Wooden hairbrush", "Wooden comb", "4 acrylic paints", "2 paint brushes", "Paint palette", "Cotton bag with a bow", "Name card"],
    duration: "About 1.5 hours",
  },
  "diy-earrings": {
    name: "DIY earrings kit", tagline: "Make your own earrings",
    description: "Beads, hoops and all the tools for everyone to make a pair or more, in a printed kraft box.",
    contents: ["Assorted beads", "Hoops and hooks", "Mini pliers", "Shaping wire", "Storage box", "Step-by-step card", "Name card"],
    duration: "About 1 hour",
  },
  "candle-making": {
    name: "Candle-making kit", tagline: "Your candle, your scent",
    description: "Soy wax, fragrance oils and a jar. Everyone picks a scent, pours her candle and takes it home.",
    contents: ["Soy wax", "Glass jar", "Wooden wick", "2 fragrance oils", "Stirring stick", "Jar sticker", "Name card"],
    duration: "About 1 hour",
  },
  "paint-tote": {
    name: "Paint-a-tote kit", tagline: "A bag nobody else has",
    description: "A plain cotton tote, washable fabric paints and stencils. Perfect for any girls' night.",
    contents: ["Cotton tote bag", "5 fabric paints", "2 brushes", "Design stencils", "Protective card", "Name card"],
    duration: "About 1 hour",
  },
  "paint-mug": {
    name: "Paint-a-mug kit", tagline: "Your mug, by hand",
    description: "A white ceramic mug and ceramic markers. Draw or write anything, then set it in your oven at home.",
    contents: ["White ceramic mug", "4 ceramic markers", "Design ideas sheet", "Gift box", "Name card"],
    duration: "About 45 minutes",
  },
};

export const bridalEn: Record<string, Localized> = {
  "bridesmaid-proposal": {
    name: "Will you be my bridesmaid? box", tagline: "Ask her in a way she won't forget",
    description: "A box your friend opens to find the question: will you be my bridesmaid? Plus gifts with her name to keep after the wedding.",
    contents: ["\"Will you be my bridesmaid?\" card", "Satin robe embroidered with her name", "Name tumbler", "Satin scrunchie", "Mini candle", "Box with a bow"],
  },
  "wedding-day-squad": {
    name: "Bridesmaids' wedding-day box", tagline: "Photo-ready from the morning",
    description: "Everything the bridesmaids need on the day: a name robe for the photos and little comforts for the whole day.",
    contents: ["Satin name robe", "Velvet slippers", "Eye mask", "Scrunchie", "Mini perfume", "Thank-you card from the bride"],
  },
  "bride-box": {
    name: "Bride box", tagline: "Just for you, bride",
    description: "A gift for the bride herself, from her best friend or the groom: a Bride robe, a dress hanger with her name and treats for the big day.",
    contents: ["Satin Bride robe", "Dress hanger with her name", "Bride-to-be tumbler", "Mini tiara", "Scented candle", "Card with your message"],
  },
  "mother-of-bride": {
    name: "Mother of the bride gift", tagline: "Thank you, Mom",
    description: "A thank-you for the mother of the bride or groom: a soft shawl, a framed photo of you and a heartfelt card.",
    contents: ["Soft shawl", "Framed photo", "Scented candle", "Thank-you card"],
  },
  "flower-girl": {
    name: "Flower girl box", tagline: "For the littlest one at the wedding",
    description: "A flower crown, a little bag with her name and a teddy, so she feels like the princess of the day.",
    contents: ["Flower crown", "Little name bag", "Small teddy", "Colourful card"],
  },
};

export const seasonsEn: Record<string, Localized> = {
  "christmas-2027": {
    name: "Christmas & New Year",
    bannerTitle: "Christmas & New Year gifts",
    bannerSubtitle: "Ready, wrapped packages delivered to the door in Assiut",
  },
};

export const zonesEn: Record<string, string> = {
  "مدينة أسيوط": "Assiut City",
  "أسيوط الجديدة": "New Assiut",
  "مركز أسيوط": "Assiut Markaz",
  "منفلوط": "Manfalut",
  "أبنوب": "Abnub",
  "الفتح": "El Fath",
  "أبو تيج": "Abu Tig",
  "ديروط": "Dayrout",
  "القوصية": "El Qusiya",
  "ساحل سليم": "Sahel Selim",
  "البداري": "El Badari",
  "صدفا": "Sidfa",
  "الغنايم": "El Ghanayem",
  "محافظة تانية (شركة شحن)": "Other governorate (courier)",
};

export const boxSizesEn: Record<string, string> = { صغير: "Small", متوسط: "Medium", كبير: "Large" };
