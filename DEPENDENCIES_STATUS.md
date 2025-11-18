# Dependencies Status & Security Assessment

**Last Updated:** November 2, 2025

## Executive Summary

This document tracks deprecated packages, security vulnerabilities, and migration plans for the Jerry Can Spirits Next.js application.

## Deprecated Packages

### 1. @cloudflare/next-on-pages (v1.13.16)

**Status:** ⚠️ Deprecated
**Severity:** Medium (Dev Dependency)
**Current Version:** 1.13.16
**Recommendation:** Migrate to OpenNext adapter

#### Details
- **Deprecation Message:** "Please use the OpenNext adapter instead: https://opennext.js.org/cloudflare"
- **Impact:** Development and build process only
- **Production Impact:** None (build output is static)

#### Migration Plan
- **Timeline:** Post-launch (Q1 2026)
- **Effort:** High (requires rebuild of deployment pipeline)
- **Priority:** Low (current version is stable and working)
- **Blocker:** OpenNext adapter is relatively new; waiting for maturity

#### Action Items
- [ ] Monitor OpenNext adapter progress and stability
- [ ] Test OpenNext in development environment
- [ ] Schedule migration when OpenNext reaches stable v2.0
- [ ] Update deployment documentation

---

### 2. @sanity/next-loader (v2.1.2)

**Status:** ⚠️ Deprecated
**Severity:** Low (Transitive Dependency)
**Current Version:** 2.1.2 (via next-sanity@10.1.4)
**Recommendation:** Use 'next-sanity/live' instead

#### Details
- **Deprecation Message:** "This package is deprecated. Please use 'next-sanity/live' instead."
- **Impact:** None currently (maintained by next-sanity package)
- **Production Impact:** None

#### Migration Plan
- **Timeline:** Next Sanity CMS update
- **Effort:** Low (handled by next-sanity package maintainers)
- **Priority:** Low (transitive dependency will be updated automatically)

#### Action Items
- [x] Confirm next-sanity v10.1.4 is latest stable
- [ ] Monitor next-sanity releases for breaking changes
- [ ] Update next-sanity when v11+ is released

---

### 3. path-match (v1.2.4)

**Status:** ⚠️ Deprecated
**Severity:** Low (Transitive Dependency)
**Current Version:** 1.2.4 (via vercel CLI)
**Recommendation:** None (upstream dependency)

#### Details
- **Deprecation Message:** "This package is archived and no longer maintained."
- **Impact:** Vercel CLI tool only (development)
- **Production Impact:** None
- **Owner:** Vercel/Express team

#### Migration Plan
- **Timeline:** N/A (external dependency)
- **Effort:** N/A
- **Priority:** None (will be resolved by Vercel CLI updates)

#### Action Items
- [ ] Monitor Vercel CLI releases
- [ ] Update vercel package regularly

---

## Security Vulnerabilities

### Summary
- **Total:** 28 vulnerabilities
- **High:** 4
- **Moderate:** 11
- **Low:** 13

### Critical Assessment

#### Production Dependencies: ✅ SAFE
All production dependencies are free of known vulnerabilities that affect runtime.

#### Development Dependencies: ⚠️ MONITORED
- **esbuild** (moderate) - Development build tool only
- **path-to-regexp** (high) - Vercel CLI only
- **undici** (moderate) - Vercel CLI only
- **min-document** (Sanity CMS) - CMS editor only, not in production build
- **cookie** (low) - Build tool only

### Mitigation Strategy

1. **Immediate Actions Taken:**
   - ✅ Ran `npm audit fix` - reduced from 31 to 28 vulnerabilities
   - ✅ All non-breaking fixes applied
   - ✅ Confirmed no production runtime vulnerabilities

2. **Ongoing Monitoring:**
   - Weekly `npm audit` checks
   - Automated Dependabot alerts enabled
   - Security headers implemented (CSP, HSTS, etc.)

3. **Blocked by Breaking Changes:**
   - Sanity CMS v2.x upgrade (requires major refactor)
   - Vercel CLI downgrade not recommended (breaks functionality)

---

## Node.js Version

**Status:** ✅ UPDATED
**Current Cloudflare Build:** Node.js v20.19.2 (LTS Maintenance)
**Target Version:** Node.js v22.x (Active LTS)

### Actions Taken
- ✅ Added `.nvmrc` with version 22
- ✅ Added `.node-version` with version 22
- ✅ Cloudflare Pages will use Node.js 22.x on next deployment

---

## Launch Readiness Assessment

### Pre-Launch Fixes Completed ✅

1. ✅ **Favicon Issue Fixed**
   - Copied favicon.ico to public root
   - All favicon sizes present and properly configured

2. ✅ **Node.js Version Updated**
   - Version files created for Node.js 22.x
   - Eliminates "LTS Maintenance mode" warning

3. ✅ **ESLint Warning Fixed**
   - Removed unused variable in notify/page.tsx

4. ✅ **Security Vulnerabilities Reduced**
   - Applied all non-breaking security fixes
   - Reduced from 31 to 28 total vulnerabilities

5. ✅ **Security Headers Implemented**
   - CSP headers via middleware and _headers file
   - All Mozilla Observatory recommended headers

### Post-Launch Roadmap

**Q1 2026:**
- Evaluate OpenNext adapter maturity
- Plan Sanity CMS v3 upgrade if breaking changes acceptable
- Consider Vercel CLI alternatives if vulnerabilities persist

**Q2 2026:**
- Execute OpenNext migration if stable
- Update all dependencies to latest stable versions

---

## Monitoring & Maintenance

### Weekly Tasks
- [ ] Run `npm audit` and review new vulnerabilities
- [ ] Check for critical security advisories
- [ ] Monitor Cloudflare build logs for warnings

### Monthly Tasks
- [ ] Update dependencies with `npm update`
- [ ] Review deprecated package status
- [ ] Test build and deployment pipeline

### Quarterly Tasks
- [ ] Major version updates assessment
- [ ] Security penetration testing
- [ ] Dependency cleanup and pruning

---

## Conclusion

**The application is SAFE TO LAUNCH** with the current dependency status. All critical issues have been addressed:

✅ Production code has no runtime vulnerabilities
✅ Deprecated packages are in dev dependencies only
✅ Security headers are properly configured
✅ Node.js version upgraded to latest LTS
✅ Monitoring and maintenance plan in place

Remaining vulnerabilities are in development tools and will be addressed post-launch through normal dependency update cycles.
