# Jerry Can Spirits - SEO Implementation Checklist

Quick reference for implementing and tracking SEO improvements.

---

## ✅ Completed (Ready to Use)

### Technical SEO
- [x] Sitemap configured and updated (`/sitemap.xml`)
- [x] Robots.txt optimized (`/robots.txt`)
- [x] FAQ page schema markup (FAQPage)
- [x] Friends page schema markup (CollectionPage)
- [x] All images have alt text
- [x] Internal linking optimized
- [x] Mobile responsive design
- [x] HTTPS enabled

### New Pages
- [x] Friends & Partners page live at `/friends`
- [x] Already added to footer navigation
- [x] Spirit of Wales Distillery featured

### Components Built
- [x] Instagram feed component
- [x] Trustpilot widget component
- [x] Both ready for credentials

---

## 🎯 To Do When You Return

### High Priority (Quick Wins)

#### 1. Trustpilot Setup (15 minutes)
- [ ] Sign up at https://www.trustpilot.com/
- [ ] Verify your domain
- [ ] Get Business Unit ID from dashboard
- [ ] Update `src/components/TrustpilotWidget.tsx` line 36
- [ ] Add widget to homepage
- [ ] Test on live site

#### 2. Instagram API Setup (30 minutes)
- [ ] Create Facebook Developer account
- [ ] Create app with Instagram Basic Display
- [ ] Get Instagram User ID
- [ ] Generate long-lived access token
- [ ] Add to `.env.local`:
  ```
  INSTAGRAM_ACCESS_TOKEN=your_token
  INSTAGRAM_USER_ID=your_id
  ```
- [ ] Test locally
- [ ] Add to production environment variables
- [ ] Add feed to desired pages

#### 3. Google Search Console (10 minutes)
- [ ] Sign up at https://search.google.com/search-console
- [ ] Verify domain ownership
- [ ] Submit sitemap: `https://jerrycanspirits.co.uk/sitemap.xml`
- [ ] Check indexing status

---

## 📊 Medium Priority (This Week)

### Partner Outreach
- [ ] Contact 3-5 small batch distilleries
- [ ] Explain Friends of Jerry Can Spirits concept
- [ ] Get their logos and info
- [ ] Add to `/friends` page
- [ ] Email them when they're featured
- [ ] Request reciprocal link

### Review Collection
- [ ] Email recent customers for Trustpilot reviews
- [ ] Add Trustpilot link to order confirmation emails
- [ ] Post on social media asking for reviews
- [ ] Target: Get 10 reviews in first month

### Content Audit
- [ ] Review all page titles (unique, compelling?)
- [ ] Review all meta descriptions (150-160 chars?)
- [ ] Ensure every page has clear H1 tag
- [ ] Check for broken links

---

## 🚀 Low Priority (This Month)

### Analytics Setup
- [ ] Verify Google Analytics is tracking
- [ ] Set up conversion goals (mailing list, sales)
- [ ] Create custom dashboard for SEO metrics
- [ ] Set up weekly reports

### Bing Webmaster Tools
- [ ] Sign up at https://www.bing.com/webmasters
- [ ] Verify domain
- [ ] Submit sitemap

### Social Proof Pages
- [ ] Consider creating `/testimonials` page
- [ ] Add customer photos (with permission)
- [ ] Feature UGC from Instagram
- [ ] Add video testimonials (future)

### Schema Expansion
- [ ] Add Product schema to shop items
- [ ] Add Review/Rating schema when available
- [ ] Add Organization schema to homepage
- [ ] Add BreadcrumbList schema to navigation

---

## 📈 Ongoing Tasks

### Weekly
- [ ] Post on Instagram (feeds your website)
- [ ] Respond to Trustpilot reviews
- [ ] Check Google Search Console for errors
- [ ] Monitor keyword rankings

### Monthly
- [ ] Add new partner to Friends page
- [ ] Review top performing pages
- [ ] Update FAQ with new questions
- [ ] Check competitor SEO strategies

### Quarterly
- [ ] Full SEO audit
- [ ] Review backlink profile
- [ ] Update sitemap priorities
- [ ] Refresh token for Instagram API (60 days)

---

## 🎬 Quick Start Guide

**First Hour Back:**
1. Sign up for Trustpilot (15 min)
2. Set up Google Search Console (10 min)
3. Submit sitemap (2 min)
4. Review `/friends` page (5 min)
5. Plan partner outreach (20 min)

**First Day Back:**
1. Complete Instagram API setup (30 min)
2. Add Trustpilot widget to homepage (10 min)
3. Test both features locally (10 min)
4. Deploy to production (15 min)
5. Contact first 3 potential partners (60 min)

**First Week:**
1. Get first 5 Trustpilot reviews
2. Add 2-3 partners to Friends page
3. Set up Google Analytics goals
4. Review all page meta descriptions

---

## 📞 Resources

**Documentation**
- Full setup guide: `SEO_SETUP.md`
- Component examples: `COMPONENT_USAGE_EXAMPLES.md`
- What's new: `WHATS_NEW.md`

**External Resources**
- Google Search Console: https://search.google.com/search-console
- Trustpilot: https://www.trustpilot.com/
- Instagram API: https://developers.facebook.com/docs/instagram-basic-display-api
- Schema.org: https://schema.org/

**Testing Tools**
- Rich Results Test: https://search.google.com/test/rich-results
- PageSpeed Insights: https://pagespeed.web.dev/
- Mobile-Friendly Test: https://search.google.com/test/mobile-friendly

---

## 🎯 SEO Goals

**3 Month Goals**
- [ ] 10+ quality backlinks from partner sites
- [ ] 20+ Trustpilot reviews (4+ stars average)
- [ ] 50% increase in organic traffic
- [ ] Rank for "British rum" related keywords
- [ ] 5+ partners on Friends page

**6 Month Goals**
- [ ] 25+ backlinks
- [ ] 50+ Trustpilot reviews
- [ ] 100% increase in organic traffic
- [ ] First page Google ranking for target keywords
- [ ] 10+ partners on Friends page
- [ ] Featured in "Best British Rum" articles

---

## 💡 Pro Tips

1. **Consistency is Key**: Post on Instagram regularly (feeds your website)
2. **Ask for Reviews**: Don't be shy - happy customers want to help
3. **Partner Win-Win**: Emphasize mutual benefits when reaching out
4. **Monitor Metrics**: Set up Google Search Console alerts
5. **Stay Updated**: SEO best practices change - follow Google's guidelines

---

## ✨ Remember

All the technical foundation is done. Now it's about:
1. Getting credentials (Trustpilot, Instagram)
2. Building relationships (partners)
3. Collecting reviews (customers)
4. Creating content (Instagram)
5. Monitoring results (analytics)

**You've got this!** 🚀

---

*Last Updated: 2025-10-24*
