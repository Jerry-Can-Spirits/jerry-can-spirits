import HeroSection from "@/components/HeroSection";
import KlaviyoSignup from "@/components/KlaviyoSignup";
import StructuredData from "@/components/StructuredData";

export default function Home() {
  // Structured data for SEO
  const structuredData = [
    // Organization schema
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Jerry Can Spirits",
      "url": "https://jerrycanspirits.com",
      "logo": "https://jerrycanspirits.com/images/Logo.webp",
      "description": "Premium spirits engineered for adventure. Crafted with British precision and Caribbean soul for those who venture beyond the ordinary.",
      "foundingDate": "2025",
      "founders": [
        {
          "@type": "Person",
          "name": "Jerry Can Spirits Founders"
        }
      ],
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "GB"
      },
      "sameAs": [
        "https://www.facebook.com/JerryCanSpirits",
        "https://www.instagram.com/jerrycanspirits"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Customer Service",
        "email": "hello@jerrycanspirits.co.uk"
      }
    },
    // Website schema
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Jerry Can Spirits",
      "url": "https://jerrycanspirits.com",
      "description": "Premium British rum - Swift & Sure, Expedition Ready",
      "publisher": {
        "@type": "Organization",
        "name": "Jerry Can Spirits"
      }
    },
    // Brand schema
    {
      "@context": "https://schema.org",
      "@type": "Brand",
      "name": "Jerry Can Spirits",
      "logo": "https://jerrycanspirits.com/images/Logo.webp",
      "slogan": "Swift & Sure, Expedition Ready",
      "description": "Premium spirits engineered for adventure"
    }
  ];

  return (
    <>
      <StructuredData data={structuredData} />
      <div>
        <HeroSection />
        <KlaviyoSignup />
      </div>
    </>
  );
}
