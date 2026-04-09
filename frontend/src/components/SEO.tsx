import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl
}) => {
  useEffect(() => {
    // Update Title to the exact string requested for all pages
    document.title = "MatAll: Home Repair Supplies within 60 mins";

    const updateTag = (name: string, attr: 'name' | 'property', value?: string) => {
      if (!value) return;
      let tag = document.querySelector(`meta[${attr}="${name}"]`);
      if (tag) {
        tag.setAttribute('content', value);
      } else {
        const newTag = document.createElement('meta');
        newTag.setAttribute(attr, name);
        newTag.setAttribute('content', value);
        document.head.appendChild(newTag);
      }
    };

    // Update Meta Tags
    updateTag('description', 'name', description);
    updateTag('keywords', 'name', keywords);
    
    const brandTitle = "MatAll: Home Repair Supplies within 60 mins";
    // Update OG Tags
    updateTag('og:title', 'property', brandTitle);
    updateTag('og:description', 'property', ogDescription || description);
    updateTag('og:image', 'property', ogImage);
    updateTag('og:url', 'property', ogUrl || window.location.href);
    
    // Update Twitter Tags
    updateTag('twitter:title', 'property', brandTitle);
    updateTag('twitter:description', 'property', ogDescription || description);
    updateTag('twitter:image', 'property', ogImage);

  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogUrl]);

  return null;
};

export default SEO;
