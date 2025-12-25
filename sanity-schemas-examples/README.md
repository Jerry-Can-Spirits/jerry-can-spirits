# Jerry Can Spirits - Enhanced Field Manual Schemas

## 🎉 What's Been Enhanced

Your equipment and ingredients pages now have comprehensive, beautiful layouts with room for:

### ✅ Equipment Pages Feature:
- 📹 **YouTube Video Integration** - Embed your tutorials
- 💡 **Pro Tip Callouts** - Highlighted expert insights
- 💰 **Price Guides** - Budget vs Premium pricing
- 📊 **What to Look For** - Buying guidance with checkmarks
- ⚠️ **Common Mistakes** - Warning section with alert icons
- 🧹 **Care & Maintenance** - Lifespan and care instructions
- 🔄 **Alternatives** - Budget and premium options
- 📖 **History** - Storytelling and context
- 🍹 **Related Cocktails** - Linked cocktail cards

### ✅ Ingredient Pages Feature:
- 📹 **YouTube Video Integration** - Embed your content
- 💡 **Pro Tip Callouts** - Highlighted insights
- 🎨 **Flavor Profiles** - Primary flavors as pills + detailed tasting notes
- 📊 **Quick Facts Sidebar** - ABV, origin, strength, seasonality
- 💰 **Price Guides** - Budget and premium options
- 🔄 **Substitutions** - Alternative ingredients
- 🤝 **Pairs Well With** - Complementary flavors/foods
- 📖 **History & Production** - Origin stories and methods
- 🍹 **Related Cocktails** - Linked cocktail cards
- 🔗 **Related Ingredients** - Often used together
- 📦 **Storage & Shelf Life** - Proper handling

## 📁 Files in this Directory

1. **EQUIPMENT-SCHEMA.md** - Complete Sanity schema for equipment
2. **INGREDIENT-SCHEMA.md** - Complete Sanity schema for ingredients
3. **README.md** - This file

## 🚀 How to Implement

### Step 1: Add Fields to Sanity Studio

1. Open your Sanity Studio project
2. Navigate to your schemas folder
3. Open `equipment.js` (or `.ts`)
4. Copy the new fields from `EQUIPMENT-SCHEMA.md`
5. Repeat for `ingredient.js` using `INGREDIENT-SCHEMA.md`
6. Deploy your Sanity Studio

### Step 2: Start Adding Content

**Don't try to fill everything at once!** Here's a smart approach:

#### Week 1: YouTube Integration
- Add `videoUrl` field to schema
- Film 1-2 equipment tutorials
- Add the YouTube URLs to Sanity
- Deploy and see your videos embedded beautifully!

#### Week 2: Quick Wins
- Add `professionalTip` to 3-5 items
- Add `history` to your signature items
- Add `priceRange` to help users budget

#### Week 3: Deep Content
- Fill out `flavorProfile` for spirits
- Add `whatToLookFor` for equipment
- Link `relatedCocktails`

## 🎨 Design Highlights

All new sections have:
- ✨ Beautiful card layouts matching your brand
- 🎯 Only show when data exists (optional fields)
- 📱 Mobile responsive
- 🎭 Consistent with cocktails page design
- 🔍 SEO-optimized individual URLs

## 💡 Content Writing Tips

### For Equipment:

**Professional Tip Example:**
```
"The key to a perfect shake is the double-seal. Always test your shaker with water first - if it leaks during practice, it'll definitely leak mid-service."
```

**History Example:**
```
"The Boston Shaker became the industry standard in the 1920s during Prohibition. Bartenders needed equipment that was fast, durable, and could be quickly hidden. The two-piece design meant it could double as regular glassware if needed."
```

### For Ingredients:

**Flavor Profile - Tasting Notes Example:**
```
"Opens with bright vanilla and caramel sweetness, followed by warm oak and subtle spice. Mid-palate brings hints of dried fruit and molasses. The finish is long and warming with gentle pepper notes."
```

**Pro Tip Example:**
```
"Fresh lime juice oxidizes quickly - it's at its peak within 4 hours of juicing. Batch juice in the morning for evening service, but never use day-old juice in premium cocktails."
```

## 🎬 YouTube Video Tips

### Good Video Ideas:
- "How to use a Boston Shaker" (2-3 mins)
- "The difference between jiggers" (1-2 mins)
- "Selecting fresh limes" (2 mins)
- "How to tell if bitters have gone bad" (1 min)

### Video Best Practices:
- Keep under 5 minutes
- Start with the item name clearly stated
- Show the equipment/ingredient in first 3 seconds
- End with a call to action to your shop

## 📈 SEO Benefits

Each equipment/ingredient now has:
- Individual indexed URL
- Rich content for Google
- Video embeds (boost engagement metrics)
- Internal linking to cocktails
- Structured data-ready

## 🤔 Questions?

The code is already live and ready! All fields are:
- Optional (won't break if empty)
- Gracefully handled (sections only show with data)
- Mobile responsive
- Performance optimized

Start with the fields that excite you most. The beauty of this system is you can add content gradually as you create it!

---

**Pro tip:** Create a content calendar. Aim for 1-2 detailed equipment guides per week, and fill in fields gradually. Quality over quantity!
