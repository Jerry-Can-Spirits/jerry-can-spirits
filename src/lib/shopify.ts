import { createStorefrontApiClient } from '@shopify/storefront-api-client';

// Initialize Shopify Storefront API client
const client = createStorefrontApiClient({
  storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!,
  apiVersion: '2025-01',
  publicAccessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
});

// TypeScript interfaces for Shopify data
export interface ShopifyImage {
  url: string;
  altText: string | null;
}

export interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

export interface ShopifyPriceRange {
  minVariantPrice: ShopifyMoney;
}

export interface ShopifyProductVariant {
  id: string;
  title: string;
  price: ShopifyMoney;
  availableForSale: boolean;
  quantityAvailable?: number;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml?: string;
  priceRange: ShopifyPriceRange;
  images: ShopifyImage[];
  variants?: ShopifyProductVariant[];
}

export interface ShopifyCollection {
  title: string;
  products: ShopifyProduct[];
}

// GraphQL response types
interface ImageEdge {
  node: ShopifyImage;
}

interface ProductEdge {
  node: {
    id: string;
    title: string;
    handle: string;
    description: string;
    priceRange: ShopifyPriceRange;
    images: { edges: ImageEdge[] };
  };
}

interface VariantEdge {
  node: ShopifyProductVariant;
}

// Cart Types
export interface CartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: {
      title: string;
      handle: string;
    };
    image?: {
      url: string;
      altText: string | null;
    };
    price: ShopifyMoney;
  };
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  lines: CartLine[];
  cost: {
    totalAmount: ShopifyMoney;
    subtotalAmount: ShopifyMoney;
  };
  discountCodes?: Array<{
    code: string;
    applicable: boolean;
  }>;
}

// GraphQL cart response types
interface CartLineEdge {
  node: {
    id: string;
    quantity: number;
    merchandise: {
      id: string;
      title: string;
      product: {
        title: string;
        handle: string;
      };
      image?: {
        url: string;
        altText: string | null;
      };
      price: ShopifyMoney;
    };
  };
}

// Fetch all products
export async function getProducts(): Promise<ShopifyProduct[]> {
  const query = `
    query GetProducts {
      products(first: 20) {
        edges {
          node {
            id
            title
            handle
            description
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const { data, errors } = await client.request(query);

    if (errors) {
      console.error('GraphQL Errors:', errors);
      throw new Error('Failed to fetch products');
    }

    return data.products.edges.map((edge: ProductEdge) => ({
      ...edge.node,
      images: edge.node.images.edges.map((img: ImageEdge) => img.node),
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

// Fetch products by collection (for drinks, hardware, clothing)
// SECURE: Uses GraphQL variables instead of string interpolation
export async function getProductsByCollection(collectionHandle: string): Promise<ShopifyProduct[]> {
  const query = `
    query GetProductsByCollection($handle: String!) {
      collection(handle: $handle) {
        title
        products(first: 20) {
          edges {
            node {
              id
              title
              handle
              description
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              images(first: 1) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    handle: collectionHandle,
  };

  try {
    const { data, errors } = await client.request(query, { variables });

    if (errors) {
      console.error('GraphQL Errors:', errors);
      throw new Error('Failed to fetch collection');
    }

    if (!data.collection) {
      return [];
    }

    return data.collection.products.edges.map((edge: ProductEdge) => ({
      ...edge.node,
      images: edge.node.images.edges.map((img: ImageEdge) => img.node),
    }));
  } catch (error) {
    console.error('Error fetching collection:', error);
    throw error;
  }
}

// Fetch single product by handle
// SECURE: Uses GraphQL variables instead of string interpolation
export async function getProduct(handle: string): Promise<ShopifyProduct | null> {
  const query = `
    query GetProduct($handle: String!) {
      product(handle: $handle) {
        id
        title
        handle
        description
        descriptionHtml
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 5) {
          edges {
            node {
              url
              altText
            }
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              price {
                amount
                currencyCode
              }
              availableForSale
              quantityAvailable
            }
          }
        }
      }
    }
  `;

  const variables = {
    handle,
  };

  try {
    const { data, errors } = await client.request(query, { variables });

    if (errors) {
      console.error('GraphQL Errors:', errors);
      throw new Error('Failed to fetch product');
    }

    if (!data.product) {
      return null;
    }

    // Debug log to see what Storefront API returns
    console.log('🔍 Storefront API Product Data:', JSON.stringify(data.product, null, 2));

    return {
      ...data.product,
      images: data.product.images.edges.map((edge: ImageEdge) => edge.node),
      variants: data.product.variants.edges.map((edge: VariantEdge) => edge.node),
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

// ===== CART FUNCTIONS =====

// Create a new cart
export async function createCart(): Promise<Cart> {
  const query = `
    mutation {
      cartCreate {
        cart {
          id
          checkoutUrl
          lines(first: 10) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      title
                      handle
                    }
                    image {
                      url
                      altText
                    }
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
          }
        }
      }
    }
  `;

  try {
    const response = await client.request(query);

    console.log('🔍 Full Shopify Response:', JSON.stringify(response, null, 2));

    const { data, errors } = response;

    if (errors && Object.keys(errors).length > 0) {
      console.error('❌ GraphQL Errors:', JSON.stringify(errors, null, 2));
      throw new Error(`Shopify API Error: ${JSON.stringify(errors)}`);
    }

    if (!data?.cartCreate?.cart) {
      console.error('❌ No cart created. Response:', data);
      throw new Error('Failed to create cart - no cart returned');
    }

    console.log('✅ Cart created successfully:', data.cartCreate.cart.id);

    return {
      ...data.cartCreate.cart,
      lines: data.cartCreate.cart.lines.edges.map((edge: CartLineEdge) => edge.node),
    };
  } catch (error) {
    console.error('💥 Error creating cart:', error);
    throw error;
  }
}

// Add item to cart
export async function addToCart(cartId: string, variantId: string, quantity: number = 1): Promise<Cart> {
  console.log('🛒 Adding to cart:', { cartId, variantId, quantity });

  const query = `
    mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      title
                      handle
                    }
                    image {
                      url
                      altText
                    }
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
          }
        }
      }
    }
  `;

  const variables = {
    cartId,
    lines: [
      {
        merchandiseId: variantId,
        quantity,
      },
    ],
  };

  try {
    const { data, errors } = await client.request(query, { variables });

    console.log('📦 Cart API Response:', { data, errors });

    if (errors) {
      console.error('❌ GraphQL Errors:', errors);
      throw new Error('Failed to add to cart');
    }

    if (!data?.cartLinesAdd?.cart) {
      console.error('❌ No cart data returned');
      throw new Error('No cart data returned from Shopify');
    }

    return {
      ...data.cartLinesAdd.cart,
      lines: data.cartLinesAdd.cart.lines.edges.map((edge: CartLineEdge) => edge.node),
    };
  } catch (error) {
    console.error('💥 Error adding to cart:', error);
    throw error;
  }
}

// Update cart line quantity
export async function updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart> {
  const query = `
    mutation UpdateCartLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      title
                      handle
                    }
                    image {
                      url
                      altText
                    }
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
          }
        }
      }
    }
  `;

  const variables = {
    cartId,
    lines: [
      {
        id: lineId,
        quantity,
      },
    ],
  };

  try {
    const { data, errors } = await client.request(query, { variables });

    if (errors) {
      console.error('GraphQL Errors:', errors);
      throw new Error('Failed to update cart');
    }

    return {
      ...data.cartLinesUpdate.cart,
      lines: data.cartLinesUpdate.cart.lines.edges.map((edge: CartLineEdge) => edge.node),
    };
  } catch (error) {
    console.error('Error updating cart:', error);
    throw error;
  }
}

// Remove item from cart
export async function removeFromCart(cartId: string, lineIds: string[]): Promise<Cart> {
  const query = `
    mutation RemoveFromCart($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          id
          checkoutUrl
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      title
                      handle
                    }
                    image {
                      url
                      altText
                    }
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
          }
        }
      }
    }
  `;

  const variables = {
    cartId,
    lineIds,
  };

  try {
    const { data, errors } = await client.request(query, { variables });

    if (errors) {
      console.error('GraphQL Errors:', errors);
      throw new Error('Failed to remove from cart');
    }

    return {
      ...data.cartLinesRemove.cart,
      lines: data.cartLinesRemove.cart.lines.edges.map((edge: CartLineEdge) => edge.node),
    };
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
}

// Apply discount code
export async function applyDiscount(cartId: string, discountCodes: string[]): Promise<Cart> {
  const query = `
    mutation ApplyDiscount($cartId: ID!, $discountCodes: [String!]!) {
      cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
        cart {
          id
          checkoutUrl
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      title
                      handle
                    }
                    image {
                      url
                      altText
                    }
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
          }
          discountCodes {
            code
            applicable
          }
        }
      }
    }
  `;

  const variables = {
    cartId,
    discountCodes,
  };

  try {
    const { data, errors } = await client.request(query, { variables });

    if (errors) {
      console.error('GraphQL Errors:', errors);
      throw new Error('Failed to apply discount');
    }

    return {
      ...data.cartDiscountCodesUpdate.cart,
      lines: data.cartDiscountCodesUpdate.cart.lines.edges.map((edge: CartLineEdge) => edge.node),
    };
  } catch (error) {
    console.error('Error applying discount:', error);
    throw error;
  }
}

// Get cart by ID
export async function getCart(cartId: string): Promise<Cart | null> {
  const query = `
    query GetCart($cartId: ID!) {
      cart(id: $cartId) {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product {
                    title
                    handle
                  }
                  image {
                    url
                    altText
                  }
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
        }
        discountCodes {
          code
          applicable
        }
      }
    }
  `;

  const variables = {
    cartId,
  };

  try {
    const { data, errors } = await client.request(query, { variables });

    if (errors) {
      console.error('GraphQL Errors:', errors);
      throw new Error('Failed to get cart');
    }

    if (!data.cart) {
      return null;
    }

    return {
      ...data.cart,
      lines: data.cart.lines.edges.map((edge: CartLineEdge) => edge.node),
    };
  } catch (error) {
    console.error('Error getting cart:', error);
    throw error;
  }
}
