# Cloudflare Security Audit & Hardening Guide

Comprehensive security review based on the CIA Triad (Confidentiality, Integrity, Availability) for Jerry Can Spirits hosted on Cloudflare Pages.

---

## Executive Summary

This document provides a systematic review of Cloudflare security settings for a small business/one-person operation with limited budget. Settings are prioritized by impact and ease of implementation.

**Priority Levels:**
- **CRITICAL** - Must implement immediately
- **HIGH** - Implement within 1 week
- **MEDIUM** - Implement when possible
- **LOW** - Nice to have

---

## 1. CONFIDENTIALITY

Protecting data from unauthorized access and disclosure.

### 1.1 SSL/TLS Settings (CRITICAL)

**Current Status:** Check via Cloudflare Dashboard → SSL/TLS

**Recommended Settings:**

| Setting | Recommended Value | Why |
|---------|------------------|-----|
| SSL/TLS Encryption Mode | Full (Strict) | Ensures end-to-end encryption with valid certificate |
| Always Use HTTPS | ON | Forces all HTTP to HTTPS |
| Automatic HTTPS Rewrites | ON | Rewrites HTTP links to HTTPS |
| Minimum TLS Version | TLS 1.2 or higher | TLS 1.0/1.1 are deprecated and insecure |
| Opportunistic Encryption | ON | Uses HTTP/2 Server Push for better security |
| TLS 1.3 | ON | Latest, fastest, most secure TLS version |
| Certificate Transparency Monitoring | ON | Monitors for unauthorized certificates |

**How to Check:**
1. Go to Cloudflare Dashboard → Your Domain → SSL/TLS
2. Verify "Full (Strict)" mode is selected
3. Navigate to "Edge Certificates" tab
4. Verify all recommended settings

**Cost:** FREE

---

### 1.2 Authenticated Origin Pulls (HIGH)

Ensures requests to your origin server come only from Cloudflare, not attackers.

**How to Enable:**
1. Cloudflare Dashboard → SSL/TLS → Origin Server
2. Enable "Authenticated Origin Pulls"
3. Install Cloudflare Origin CA certificate on origin (Cloudflare Pages handles this automatically)

**Cost:** FREE

---

### 1.3 DNS Security (HIGH)

**DNSSEC (Domain Name System Security Extensions)**

Protects against DNS spoofing/cache poisoning attacks.

**How to Enable:**
1. Cloudflare Dashboard → DNS → Settings
2. Click "Enable DNSSEC"
3. Add the DS record to your domain registrar

**Cost:** FREE

**Priority:** HIGH - Protects integrity of DNS lookups

---

### 1.4 Access Control (MEDIUM - if using /studio route)

Protect Sanity Studio admin panel at `/studio/*` route.

**Option 1: Cloudflare Access (Zero Trust) - FREE for up to 50 users**

1. Cloudflare Dashboard → Zero Trust → Access → Applications
2. Create new Application:
   - Name: "Sanity Studio"
   - Subdomain: your-domain.com
   - Path: `/studio/*`
3. Add authentication method (Google, GitHub, Email OTP)
4. Create policy: Allow only your email addresses

**Option 2: IP Allowlist via Firewall Rules**

If you have a static IP, restrict `/studio/*` to your IP only (see Firewall section).

**Cost:** FREE (up to 50 users)

---

## 2. INTEGRITY

Ensuring data hasn't been tampered with in transit.

### 2.1 Security Headers (CRITICAL - ALREADY IMPLEMENTED)

**Status:** ✅ Implemented in `next.config.ts`

Your current headers are excellent. After Mozilla Observatory testing, verify these are being served:

```
✅ Content-Security-Policy
✅ Strict-Transport-Security
✅ X-Frame-Options
✅ X-Content-Type-Options
✅ X-XSS-Protection
✅ Referrer-Policy
✅ Permissions-Policy
```

**Test Command:**
```bash
curl -I https://your-domain.com/ | grep -i "content-security\|x-frame\|strict-transport"
```

---

### 2.2 Subresource Integrity (SRI) (MEDIUM)

Ensures third-party scripts haven't been tampered with.

**Current Status:** Check your HTML for SRI attributes on external scripts

**How to Implement:**

For any external script tags in your code:

```html
<!-- Without SRI (vulnerable) -->
<script src="https://cdn.example.com/library.js"></script>

<!-- With SRI (protected) -->
<script
  src="https://cdn.example.com/library.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous">
</script>
```

**Generate SRI Hash:**
```bash
curl https://cdn.example.com/library.js | openssl dgst -sha384 -binary | openssl base64 -A
```

**Priority:** MEDIUM - Important for any external scripts you load

---

### 2.3 HSTS Preloading (HIGH)

**Current Status:** Check if your domain is on the HSTS preload list: https://hstspreload.org/

Your HSTS header is already set correctly:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Action Required:**
1. Visit https://hstspreload.org/
2. Enter your domain
3. Submit for inclusion in browser HSTS preload lists

**Benefits:**
- Browsers will NEVER allow HTTP connections (even on first visit)
- Protection against SSL stripping attacks

**Cost:** FREE
**Priority:** HIGH

---

### 2.4 Page Integrity Check (CRITICAL)

Enable Cloudflare's integrity check to ensure pages aren't corrupted.

**How to Enable:**
1. Cloudflare Dashboard → Speed → Optimization
2. Ensure "Auto Minify" is configured properly (test to avoid breaking JavaScript)
3. Enable "Brotli" compression (better than gzip, maintains integrity)

**Cost:** FREE

---

## 3. AVAILABILITY

Ensuring the site remains accessible to legitimate users.

### 3.1 DDoS Protection (CRITICAL - Already Active)

**Status:** ✅ Cloudflare provides automatic DDoS protection on all plans

**Additional Settings to Verify:**

1. **Cloudflare Dashboard → Security → Settings**
   - Security Level: "Medium" (recommended starting point)
   - Challenge Passage: 30 minutes
   - Browser Integrity Check: ON

**Cost:** FREE (included in all plans)

---

### 3.2 Rate Limiting (HIGH)

Protect against abuse and bot attacks.

**Cloudflare Pages Free Tier Limitations:**
- No native Rate Limiting rules (paid feature)
- **Alternative:** Use WAF Custom Rules (limited on free plan)

**Free Workaround - WAF Custom Rule:**

Create rules to block suspicious traffic patterns:

1. Cloudflare Dashboard → Security → WAF → Create Rule

**Example Rule 1: Block Excessive Requests**
```
(http.request.uri.path contains "/api/" and rate.limit > 60)
Action: Block
```

**Example Rule 2: Block Known Bad Bots**
```
(cf.bot_management.score < 30)
Action: Challenge
```

**Free Plan Limit:** 5 custom rules
**Cost:** FREE (up to 5 rules), $5/month for 10 rules

---

### 3.3 Bot Protection (HIGH)

**Super Bot Fight Mode (FREE)**

1. Cloudflare Dashboard → Security → Bots
2. Enable "Super Bot Fight Mode"
3. Configure:
   - Definitely automated: Block
   - Likely automated: Challenge
   - Verified bots: Allow (Google, Bing, etc.)

**Cost:** FREE
**Priority:** HIGH - Reduces server load and protects against scraping

---

### 3.4 Firewall Rules (CRITICAL)

Create strategic firewall rules to block threats.

**Recommended Rules (Priority Order):**

**Rule 1: Block Known Threat Countries (if applicable)**
```
(ip.geoip.country in {"CN" "RU" "KP"}) and not (http.request.uri.path contains "/api/shopify")
Action: Block or Challenge
```
*Note: Only block if you don't expect legitimate traffic from these regions*

**Rule 2: Protect Sanity Studio**
```
(http.request.uri.path contains "/studio") and not (ip.src in {YOUR_IP_ADDRESS})
Action: Block
```

**Rule 3: Block Common Attack Patterns**
```
(http.request.uri.path contains "wp-admin" or http.request.uri.path contains "phpMyAdmin" or http.request.uri.path contains ".env")
Action: Block
```

**Rule 4: Block SQL Injection Attempts**
```
(http.request.uri contains "UNION SELECT" or http.request.uri contains "1=1" or http.request.uri contains "' OR '1'='1")
Action: Block
```

**Rule 5: Block Excessive API Calls (Rate Limiting Alternative)**
```
(http.request.uri.path eq "/api/contact" and cf.threat_score > 10)
Action: Challenge
```

**Free Plan Limit:** 5 firewall rules
**Cost:** FREE (5 rules), Paid plans get more

**How to Create:**
1. Cloudflare Dashboard → Security → WAF → Create firewall rule
2. Add each rule with appropriate action

---

### 3.5 Caching & Performance (MEDIUM)

Proper caching improves availability under load.

**Recommended Settings:**

1. **Cloudflare Dashboard → Caching → Configuration**
   - Browser Cache TTL: "Respect Existing Headers" (Next.js handles this)
   - Caching Level: "Standard"
   - Always Online: ON (serves cached version if origin is down)

2. **Page Rules for Static Assets:**
   - Pattern: `*your-domain.com/*.jpg`
   - Settings: Cache Level: Cache Everything, Edge Cache TTL: 1 month
   - Repeat for: `.png`, `.css`, `.js`, `.woff2`, `.svg`

**Cost:** FREE (3 page rules on free plan)

---

### 3.6 Under Attack Mode (CRITICAL - Emergency Use)

When experiencing active DDoS attack.

**How to Enable:**
1. Cloudflare Dashboard → Overview
2. Click "Under Attack Mode" toggle

**What it does:**
- Shows JavaScript challenge to all visitors
- Blocks automated bots
- Temporarily reduces performance for human visitors

**When to use:** Only during active attack
**Cost:** FREE

---

## 4. ADDITIONAL SECURITY HARDENING

### 4.1 Email Security (HIGH - if using custom domain email)

**SPF Record:**
```
v=spf1 include:_spf.google.com include:servers.mcsv.net include:sendgrid.net ~all
```
*Adjust based on your email provider (Gmail, Klaviyo, etc.)*

**DKIM:** Configure with your email provider

**DMARC Record:**
```
_dmarc.your-domain.com TXT v=DMARC1; p=quarantine; rua=mailto:your-email@domain.com
```

**How to Add:**
1. Cloudflare Dashboard → DNS → Records → Add Record
2. Type: TXT
3. Add SPF and DMARC records

**Cost:** FREE
**Priority:** HIGH - Prevents email spoofing

---

### 4.2 CAA Records (MEDIUM)

Specifies which Certificate Authorities can issue SSL certificates for your domain.

**How to Add:**
1. Cloudflare Dashboard → DNS → Records → Add Record
2. Type: CAA
3. Add records:
```
your-domain.com CAA 0 issue "letsencrypt.org"
your-domain.com CAA 0 issue "digicert.com"
your-domain.com CAA 0 issuewild "letsencrypt.org"
your-domain.com CAA 0 iodef "mailto:your-email@domain.com"
```

**Cost:** FREE
**Priority:** MEDIUM - Prevents unauthorized certificate issuance

---

### 4.3 Security.txt (LOW)

Provides security researchers a way to contact you.

**Create file:** `/public/.well-known/security.txt`

```
Contact: mailto:security@your-domain.com
Expires: 2026-12-31T23:59:59.000Z
Preferred-Languages: en
Canonical: https://your-domain.com/.well-known/security.txt
```

**Cost:** FREE
**Priority:** LOW - But professional

---

### 4.4 HTTP/3 (QUIC) (MEDIUM)

Faster, more secure protocol.

**How to Enable:**
1. Cloudflare Dashboard → Network
2. Enable "HTTP/3 (with QUIC)"
3. Enable "0-RTT Connection Resumption" (even faster)

**Cost:** FREE
**Priority:** MEDIUM - Performance & security improvement

---

## 5. MONITORING & ALERTING

### 5.1 Cloudflare Analytics (FREE)

Monitor traffic patterns and threats.

**How to Use:**
1. Cloudflare Dashboard → Analytics & Logs
2. Review regularly:
   - Traffic patterns
   - Threats blocked
   - Countries accessing site
   - Top paths

**Cost:** FREE

---

### 5.2 Notifications (CRITICAL)

Get alerted to security events.

**How to Configure:**
1. Cloudflare Dashboard → Notifications
2. Enable:
   - DDoS Attack Alerts
   - SSL Certificate Expiration
   - Firewall Events (if seeing attacks)
   - Universal SSL Disabled

**Cost:** FREE

---

## 6. IMPLEMENTATION CHECKLIST

### Immediate Actions (Do Now - 30 minutes)

- [ ] Verify SSL/TLS set to "Full (Strict)"
- [ ] Enable Always Use HTTPS
- [ ] Enable Minimum TLS 1.2
- [ ] Enable TLS 1.3
- [ ] Enable Browser Integrity Check
- [ ] Enable Super Bot Fight Mode
- [ ] Create firewall rule to protect `/studio` route
- [ ] Enable security notifications
- [ ] Test CSP headers with Mozilla Observatory

### This Week (Priority: HIGH)

- [ ] Enable DNSSEC
- [ ] Submit domain to HSTS preload list
- [ ] Create 5 strategic firewall rules (see section 3.4)
- [ ] Configure email security (SPF, DKIM, DMARC)
- [ ] Enable HTTP/3
- [ ] Set up Cloudflare Access for Sanity Studio (if needed)

### When Time Allows (Priority: MEDIUM)

- [ ] Add CAA records
- [ ] Implement SRI for external scripts
- [ ] Create security.txt file
- [ ] Configure page rules for static assets
- [ ] Test "Always Online" feature

### Optional Enhancements (Priority: LOW)

- [ ] Review analytics weekly
- [ ] Consider upgrading to Pro plan ($20/month) for:
  - 20 firewall rules (vs 5)
  - 20 page rules (vs 3)
  - Web Application Firewall (WAF) managed rulesets
  - Image optimization
  - Mobile redirect

---

## 7. BUDGET-FRIENDLY SECURITY ROADMAP

### Free Tier (Current - $0/month)
- Everything in this document marked "FREE"
- Excellent security for small business
- Limitations: 5 firewall rules, 5 WAF rules, 3 page rules

### Recommended Paid Upgrade Path

**If Budget Allows ($20/month - Cloudflare Pro):**
- 20 firewall rules (vs 5)
- 20 page rules (vs 3)
- WAF Managed Rulesets (OWASP Top 10 protection)
- Image optimization (improves PageSpeed)
- Improved analytics

**When Revenue Grows ($200/month - Cloudflare Business):**
- Advanced DDoS protection (100 Gbps)
- True Rate Limiting (not workarounds)
- Advanced Certificate Manager
- 24/7 email support

**Enterprise ($5,000+/month):**
- Not needed for your use case

---

## 8. TESTING & VERIFICATION

After implementing settings, test your security:

### Free Security Scanners

1. **Mozilla Observatory**
   - URL: https://observatory.mozilla.org/
   - Tests: CSP, headers, SSL, cookies
   - Target Score: A+ (90+)

2. **SSL Labs SSL Test**
   - URL: https://www.ssllabs.com/ssltest/
   - Tests: SSL/TLS configuration
   - Target Score: A+

3. **Security Headers**
   - URL: https://securityheaders.com/
   - Tests: HTTP security headers
   - Target Score: A+

4. **Cloudflare Radar**
   - URL: https://radar.cloudflare.com/scan
   - Tests: Overall security posture

### Manual Testing

```bash
# Test CSP header
curl -I https://your-domain.com/ | grep -i content-security-policy

# Test HSTS
curl -I https://your-domain.com/ | grep -i strict-transport

# Test TLS version
openssl s_client -connect your-domain.com:443 -tls1_2

# Test HTTP/3
curl --http3 -I https://your-domain.com/
```

---

## 9. INCIDENT RESPONSE PLAN

### If You Detect an Attack

1. **Immediate:**
   - Enable "Under Attack Mode"
   - Check Cloudflare Analytics → Security

2. **Within 15 minutes:**
   - Review firewall logs
   - Identify attack pattern
   - Create temporary firewall rule to block

3. **Within 1 hour:**
   - Document attack details
   - Adjust permanent firewall rules
   - Review if upgrade needed

4. **After Attack:**
   - Document lessons learned
   - Adjust security posture
   - Consider upgrading plan if attacks persist

---

## 10. CONCLUSION

### Current Status Summary

**Strengths:**
- ✅ Excellent CSP implementation
- ✅ All security headers configured
- ✅ Using Cloudflare Pages (automatic DDoS protection)
- ✅ HSTS with preload flag

**Immediate Priorities:**
1. Fix CSP detection (already done)
2. Verify SSL/TLS settings (30 min)
3. Enable DNSSEC (15 min)
4. Create 5 strategic firewall rules (30 min)
5. Submit to HSTS preload list (5 min)

**Total Time to Excellent Security:** ~90 minutes

**Ongoing Maintenance:** 15 minutes per week reviewing analytics

---

## Resources

- [Cloudflare Learning Center](https://www.cloudflare.com/learning/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

---

**Document Version:** 1.0
**Last Updated:** 2025-12-23
**Next Review:** 2026-01-23 (monthly review recommended)
