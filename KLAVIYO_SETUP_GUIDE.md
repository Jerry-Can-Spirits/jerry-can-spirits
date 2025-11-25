# Klaviyo Setup Guide for Jerry Can Spirits

Complete guide to set up Klaviyo integration from scratch.

---

## Part 1: Get Your Klaviyo Private API Key

### Step 1.1: Log into Klaviyo
1. Go to https://www.klaviyo.com/login
2. Log in with your account credentials

### Step 1.2: Create a Private API Key
1. Click on your account name (bottom left corner)
2. Go to **Settings** → **API Keys**
3. Click **Create Private API Key**

### Step 1.3: Configure API Key Permissions
Your API key needs these **Full Access** permissions:
- ✅ **Profiles** (Read + Write) - For newsletter signups and contact forms
- ✅ **Lists** (Read + Write) - For adding people to mailing lists
- ✅ **Events** (Read + Write) - For tracking signups, complaints, contact forms
- ✅ **Metrics** (Read + Write) - For custom event tracking

### Step 1.4: Copy Your API Key
1. Give it a name like "Jerry Can Spirits Website"
2. Click **Create**
3. **IMPORTANT:** Copy the key immediately - you won't see it again!
4. It will look like: `pk_1234567890abcdef1234567890abcdef`

---

## Part 2: Configure Cloudflare Workers Environment

### Step 2.1: Add to Cloudflare Dashboard
1. Go to https://dash.cloudflare.com
2. Select your account → **Workers & Pages**
3. Click on your **jerry-can-spirits** deployment
4. Go to **Settings** → **Environment Variables**

### Step 2.2: Add the Klaviyo Key
1. Click **Add variable**
2. Set:
   - **Variable name:** `KLAVIYO_PRIVATE_KEY`
   - **Value:** `pk_your_actual_key_here`
   - **Environment:** Production (and Preview if you want to test)
3. Click **Save**

### Step 2.3: Redeploy (Important!)
After adding environment variables, you need to redeploy:
1. Go to **Deployments** tab
2. Click **Create deployment**
3. Or just push a new commit to trigger deployment

---

## Part 3: Set Up Klaviyo Lists and Segments

### Step 3.1: Create Your Main Newsletter List
1. In Klaviyo, go to **Audience** → **Lists & Segments**
2. Click **Create List**
3. Name: **Newsletter Subscribers** (or your preferred name)
4. Click **Create**
5. **Copy the List ID** from the URL (it looks like `AbCd12`)

### Step 3.2: Optional - Get List ID Programmatically
If you want to use a specific list for signups, you can:
1. Go to **Audience** → **Lists & Segments**
2. Click on your list
3. The List ID is in the URL: `https://www.klaviyo.com/list/XXXXXX/...`
4. You can pass this in the `listId` field when calling the signup API

---

## Part 4: Configure Events and Metrics

Your site uses these custom events - Klaviyo will automatically create them when they're triggered:

### Events Your Site Tracks:

#### 1. **Newsletter Signup**
- Triggered when someone signs up for the newsletter
- Properties tracked:
  - `interests` (array)
  - `signup_source` ("website_newsletter")

#### 2. **Contact Form Submission**
- Triggered when someone submits the general contact form
- Properties tracked:
  - `subject`
  - `message`
  - `form_type` ("general")
  - `inquiry_type`

#### 3. **Customer Complaint**
- Triggered when someone submits the complaints form
- Properties tracked:
  - `subject`
  - `message`
  - `form_type` ("complaints")
  - `inquiry_type` ("complaint")
  - `order_number` (if provided)
  - `issue_type`
  - `priority`

#### 4. **Media Inquiry**
- Triggered when someone submits the media inquiry form
- Properties tracked:
  - `subject`
  - `message`
  - `form_type` ("media")
  - `inquiry_type` ("media")

### These will appear automatically in Klaviyo after first use!
You don't need to create them manually - Klaviyo creates metrics automatically when your site sends the first event.

---

## Part 5: Set Up Flows (Optional but Recommended)

### Recommended Flows:

#### Flow 1: Welcome Email
1. Go to **Flows** → **Create Flow**
2. Use the **Welcome Series** template
3. Trigger: When someone subscribes to your list OR metric "Newsletter Signup"
4. Email 1 (Immediate): Welcome email with exclusive content
5. Email 2 (3 days): Product highlights
6. Email 3 (7 days): Story/brand introduction

#### Flow 2: Complaint Acknowledgment
1. Create a new flow
2. Trigger: Metric "Customer Complaint"
3. Email (Immediate): "We've received your complaint and are investigating"
4. Wait 3 days
5. Email: "Follow-up on your issue"

#### Flow 3: Contact Form Response
1. Create a new flow
2. Trigger: Metric "Contact Form Submission"
3. Email (Immediate): "Thanks for reaching out - we'll respond within 24 hours"

---

## Part 6: Test the Integration

### Test 1: Newsletter Signup
1. Go to your website: https://jerrycanspirits.com
2. Find the newsletter signup form
3. Enter a test email (use your own)
4. Submit the form

**Verify in Klaviyo:**
1. Go to **Audience** → **Profiles**
2. Search for your email
3. Check:
   - ✅ Profile created
   - ✅ Properties: `signup_source`, `signup_date`, `interests`
   - ✅ Event: "Newsletter Signup" tracked
   - ✅ Subscribed to your list (if listId was provided)

### Test 2: Contact Form
1. Go to https://jerrycanspirits.com/contact
2. Fill out and submit the form

**Verify in Klaviyo:**
1. Search for the email you used
2. Check for:
   - ✅ Event: "Contact Form Submission" tracked
   - ✅ Properties include your message

### Test 3: Complaints Form
1. Go to https://jerrycanspirits.com/contact/complaints
2. Fill out and submit with priority/issue type

**Verify in Klaviyo:**
1. Search for the email
2. Check for:
   - ✅ Event: "Customer Complaint" tracked
   - ✅ Properties: `order_number`, `issue_type`, `priority`

---

## Part 7: Profile Properties Reference

Your site automatically tracks these properties on profiles:

### Newsletter Signups:
- `first_name`
- `email`
- `interests` (array)
- `signup_source` ("website_newsletter")
- `signup_date`

### Contact Forms:
- `first_name`
- `last_name`
- `email`
- `last_contact_date`
- `contact_form_submissions`
- `preferred_contact_method` ("email")
- `last_contact_type` ("general", "media", or "complaints")

---

## Part 8: Common Issues and Solutions

### Issue: "Klaviyo API key not configured"
**Solution:** Make sure you added `KLAVIYO_PRIVATE_KEY` to Cloudflare Workers environment variables and redeployed.

### Issue: Signups not appearing in Klaviyo
**Possible causes:**
1. Wrong API key (check it starts with `pk_`)
2. API key doesn't have correct permissions
3. Environment variable not deployed (redeploy after adding)
4. Check browser console for errors

### Issue: Events tracked but no emails sent
**Solution:** You need to create Flows in Klaviyo to automatically send emails when events occur.

### Issue: Duplicate profiles
**Solution:** Klaviyo matches by email address. If you see duplicates, merge them manually in Klaviyo dashboard.

---

## Current API Endpoints Using Klaviyo:

1. **`/api/klaviyo-signup`** - Newsletter signups
2. **`/api/contact`** - Contact forms, media inquiries, complaints

Both use the same `KLAVIYO_PRIVATE_KEY` environment variable.

---

## Security Notes:

✅ **What's protected:**
- Private API key stored in Cloudflare Workers (not exposed to browser)
- Rate limiting: 3-5 requests per minute per IP
- Honeypot spam protection
- Email validation
- Server-side only - no client-side API key exposure

❌ **Never:**
- Commit API keys to git
- Use the key in client-side code
- Share your private API key

---

## Quick Checklist:

- [ ] Log into Klaviyo
- [ ] Create Private API Key with Full Access to: Profiles, Lists, Events, Metrics
- [ ] Copy the API key
- [ ] Add `KLAVIYO_PRIVATE_KEY` to Cloudflare Workers environment variables
- [ ] Redeploy your site
- [ ] Test newsletter signup
- [ ] Test contact form
- [ ] Test complaints form
- [ ] Check Klaviyo for profiles and events
- [ ] (Optional) Create welcome email flow
- [ ] (Optional) Create complaint acknowledgment flow

---

## Need Help?

If you get stuck:
1. Check the Cloudflare deployment logs for errors
2. Check browser console when submitting forms
3. Verify API key permissions in Klaviyo
4. Make sure you redeployed after adding environment variables

---

**You're all set!** 🚀

Once you complete these steps, all newsletter signups, contact forms, and complaints will automatically sync to Klaviyo.
