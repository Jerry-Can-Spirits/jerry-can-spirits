# Phase 2: Ready to Begin Content Creation

## ✅ Infrastructure Complete

Your guides section is fully built and deployed:

- **Schema**: Complete Guide schema with all SEO fields in Sanity
- **Pages**: `/guides` hub and `/guides/[slug]` detail pages
- **Navigation**: Guides link added to main header
- **Sitemap**: Priority 0.9 (high SEO priority)
- **Structured Data**: Article schema, Breadcrumb schema, FAQ schema
- **Build Status**: ✅ Passing (239 pages generated)
- **Deployment**: Ready for Cloudflare Pages

---

## 📚 Content Creation Documentation

Two comprehensive guides have been created for you:

### 1. **GUIDE_CONTENT_TEMPLATE.md**
Complete template for your first pillar page:
- "The Complete Guide to Spiced Rum" (2,500-3,000 words)
- Field-by-field instructions for Sanity Studio
- Section structure with example content
- FAQ examples
- Comparison table templates
- Brand neutrality guidelines
- Quality checklist

### 2. **CLUSTER_ARTICLES_BRIEF.md**
Detailed briefs for 5 supporting articles (1,000-1,500 words each):
1. Is Dark Rum the Same as Spiced Rum?
2. Where Is Spiced Rum Made?
3. What Spices Are Used in Spiced Rum?
4. How to Drink Spiced Rum Properly
5. Spiced Rum Brands Compared: UK & Global Craft Producers

Each includes:
- Complete structure outline
- FAQ examples
- Table templates
- Brand neutrality guidelines
- Internal linking strategy

---

## 🚀 How to Access Sanity Studio

### Option 1: Local Development
```bash
npm run dev
```
Then visit: **http://localhost:3000/studio**

### Option 2: Production Studio
Visit your deployed Sanity Studio URL (if configured)

---

## 📝 Creating Your First Guide

### Step 1: Open Sanity Studio
Navigate to `/studio` and log in with your Sanity credentials

### Step 2: Create New Guide
1. Click **"Guide"** in the content types menu
2. Click **"Create New Guide"**

### Step 3: Fill in Fields (Use GUIDE_CONTENT_TEMPLATE.md as reference)

**Basic Fields:**
- Title: "The Complete Guide to Spiced Rum: History, Production & Tasting Notes"
- Slug: `complete-guide-to-spiced-rum` (auto-generates)
- Excerpt: 160 character summary
- Meta Title: 60 characters max
- Meta Description: 155-160 characters
- Keywords: Comma-separated list

**Content Fields:**
- Category: Select "spirits-education"
- Featured: ✅ Check
- Is Pillar: ✅ Check
- Author: "Jerry Can Spirits Team"
- Published At: Select today's date
- Introduction: 200-300 word opening
- Sections: Add 8 H2 sections (see template for structure)

**SEO Features:**
- FAQs: Add 3-5 question/answer pairs
- Comparison Tables: Add at least 1 table
- Featured UK Craft Distilleries: Add 3-4 entries (including Jerry Can)

**Related Content:**
- Related Cocktails: Link to Field Manual cocktails
- Related Products: Add Shopify handle for Expedition Spiced Rum
- Call to Action: "Explore Our Craft Spiced Rum" → product URL

### Step 4: Add Hero Image
Upload a high-quality image (1200x600px minimum, relevant to spiced rum)

### Step 5: Publish
Click **"Publish"** in the top-right corner

---

## 🔍 Verify Your Published Guide

After publishing, the guide will appear at:
```
https://jerrycanspirits.co.uk/guides/complete-guide-to-spiced-rum
```

### Check These Elements:
1. **Page Loads**: Visit the URL and verify content renders
2. **Structured Data**: Use [Google Rich Results Test](https://search.google.com/test/rich-results)
3. **Sitemap**: Check `/sitemap.xml` includes your guide
4. **Navigation**: Guides link in header works
5. **Mobile**: Check responsive layout on mobile devices

---

## 📊 Content Priority Order

### Week 1: Pillar Page
✅ "The Complete Guide to Spiced Rum" (2,500-3,000 words)
- This is your cornerstone content
- Take time to research and write thoroughly
- Use the template as your structure guide

### Week 2-3: Cluster Articles (in order)
1. **"Is Dark Rum the Same as Spiced Rum?"** - Answers common confusion
2. **"What Spices Are Used in Spiced Rum?"** - Ingredient education
3. **"Where Is Spiced Rum Made?"** - UK craft distillery spotlight opportunity
4. **"How to Drink Spiced Rum Properly"** - Practical, shareable content
5. **"Spiced Rum Brands Compared"** - Buying guide (most sensitive, save for last)

### Week 4: Internal Linking & Optimization
- Update pillar guide with links to cluster articles
- Cross-link between cluster articles
- Add guide links to Field Manual pages
- Add "Learn More" section to product pages
- Submit all URLs to Google Search Console

---

## 🎯 SEO Targets & Goals

### Primary Keywords (Pillar Page)
- "spiced rum" (high volume, competitive)
- "what is spiced rum" (question-based)
- "spiced rum guide" (intent-driven)
- "UK spiced rum" (local focus)

### Long-Tail Keywords (Cluster Articles)
- "is dark rum spiced rum" (800+ searches/month)
- "where is spiced rum made" (500+ searches/month)
- "what spices are in spiced rum" (600+ searches/month)
- "how to drink spiced rum" (1,000+ searches/month)
- "best spiced rum UK" (900+ searches/month)

### Success Metrics (3-6 months)
- **Organic Traffic**: +50% to guides section
- **Keyword Rankings**: Top 10 for primary keywords
- **AI Overviews**: Featured in Google AI-generated answers
- **Rich Snippets**: FAQ schema appearing in SERPs
- **Engagement**: Average 3+ minutes time on page
- **Conversions**: Guide → Product page clicks

---

## ⚠️ Brand Neutrality Reminders

As you write, keep these principles in mind:

### ✅ DO:
- Celebrate craft distilling as a movement
- Feature multiple UK distilleries with genuine praise
- Focus on production quality and craftsmanship
- Use inclusive language: "small-batch producers", "craft movement"
- Share educational content that helps all rum drinkers

### ❌ DON'T:
- Name mass-market brands (Captain Morgan, Kraken, Sailor Jerry)
- Use comparative language: "better than", "unlike commercial brands"
- Create "us vs. them" narratives
- Imply big brands are inferior
- Position Jerry Can as the only quality option

### Why This Matters:
- **Legal**: Avoid defamation or false advertising claims
- **Ethical**: Respect for all producers in the industry
- **SEO**: Google rewards helpful content, not attack content
- **Reputation**: Professional, educational tone builds authority

Your goal: **Elevate craft spirits without tearing down others.**

---

## 🛠 Technical Notes

### Content Updates
When you publish or update guides in Sanity Studio:
1. Changes appear immediately in development (`npm run dev`)
2. Production requires a new build and deployment
3. Cloudflare Pages rebuilds on git push to main/dev

### Redeploying with New Content
```bash
# Commit any local code changes first
git add .
git commit -m "content: Add new guide articles"
git push origin dev

# Cloudflare Pages will auto-rebuild
# Or trigger manual rebuild in Cloudflare dashboard
```

### Sitemap Updates
The sitemap automatically regenerates on each build, pulling all published guides from Sanity. No manual updates needed.

---

## 📞 Need Help?

### Common Questions

**Q: I can't access Sanity Studio**
- Ensure you're logged into Sanity with correct credentials
- Check that `/studio` route is accessible in development
- Verify Sanity project ID in environment variables

**Q: My guide isn't showing on the live site**
- Content appears immediately in dev, but requires rebuild for production
- Push to git triggers Cloudflare Pages rebuild
- Check Sanity Studio "Publish" button was clicked (not just saved as draft)

**Q: How do I add images to guide content?**
- Hero Image: Use the dedicated "Hero Image" field in Sanity
- Inline Images: Currently not supported in sections (future enhancement)
- For now, use the single hero image per guide

**Q: Can I preview before publishing?**
- Sanity Studio has a "Preview" tab (if configured)
- Alternatively, publish as draft and check in development environment
- Update and republish when ready

**Q: Do I need to write all 6 guides at once?**
- No! Start with the pillar page and add cluster articles over time
- Each published guide strengthens your SEO incrementally
- Quality > speed

---

## 🎉 You're Ready!

Everything is in place:
- ✅ Infrastructure built and tested
- ✅ Detailed content templates created
- ✅ Sanity Studio configured
- ✅ SEO strategy documented
- ✅ Brand guidelines established

**Next Step: Open Sanity Studio and create your first guide!**

Use `GUIDE_CONTENT_TEMPLATE.md` as your writing companion, and reference `CLUSTER_ARTICLES_BRIEF.md` when you're ready for the supporting articles.

**Happy writing! 🥃**
