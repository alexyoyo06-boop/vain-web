// Queries y mutations de la Storefront API. Strings GraphQL en bruto.

export const PRODUCT_FRAGMENT = /* GraphQL */ `
  fragment ProductCard on Product {
    id
    handle
    title
    description
    descriptionHtml
    productType
    tags
    availableForSale
    featuredImage {
      url(transform: { maxWidth: 1600 })
      altText
      width
      height
    }
    images(first: 12) {
      edges {
        node {
          url(transform: { maxWidth: 1600 })
          altText
          width
          height
        }
      }
    }
    options {
      name
      values
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 50) {
      edges {
        node {
          id
          title
          availableForSale
          selectedOptions {
            name
            value
          }
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

export const GET_PRODUCTS = /* GraphQL */ `
  ${PRODUCT_FRAGMENT}
  query GetProducts($first: Int = 50) {
    products(first: $first, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          ...ProductCard
        }
      }
    }
  }
`;

export const GET_PRODUCT_BY_HANDLE = /* GraphQL */ `
  ${PRODUCT_FRAGMENT}
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      ...ProductCard
    }
  }
`;

// --- Collections ---

export const GET_COLLECTIONS = /* GraphQL */ `
  query GetCollections($first: Int = 30) {
    collections(first: $first, sortKey: TITLE) {
      edges {
        node {
          id
          handle
          title
          description
          image {
            url(transform: { maxWidth: 800 })
            altText
          }
        }
      }
    }
  }
`;

export const GET_COLLECTION_BY_HANDLE = /* GraphQL */ `
  ${PRODUCT_FRAGMENT}
  query GetCollectionByHandle($handle: String!) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        url(transform: { maxWidth: 1200 })
        altText
      }
      products(first: 50) {
        edges {
          node {
            ...ProductCard
          }
        }
      }
    }
  }
`;

// --- Site settings (metaobject) ---

// Lee la primera entrada del metaobject "site_settings" para flags globales
// del sitio (coming soon mode, password early access, etc.).
// El amigo edita esos campos desde Shopify Admin → Contenido → Metaobjetos.
export const GET_SITE_SETTINGS = /* GraphQL */ `
  query GetSiteSettings {
    metaobjects(type: "site_settings", first: 1) {
      edges {
        node {
          handle
          fields {
            key
            value
          }
        }
      }
    }
  }
`;

// --- Customer (newsletter signup) ---

export const CUSTOMER_CREATE = /* GraphQL */ `
  mutation CustomerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
        phone
        firstName
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

// --- Cart ---

export const CART_FRAGMENT = /* GraphQL */ `
  fragment CartShape on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 50) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              selectedOptions {
                name
                value
              }
              price {
                amount
                currencyCode
              }
              image {
                url(transform: { maxWidth: 400 })
                altText
              }
              product {
                handle
                title
                productType
              }
            }
          }
        }
      }
    }
  }
`;

export const CART_CREATE = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation CartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart { ...CartShape }
      userErrors { field message }
    }
  }
`;

export const CART_GET = /* GraphQL */ `
  ${CART_FRAGMENT}
  query CartGet($id: ID!) {
    cart(id: $id) { ...CartShape }
  }
`;

export const CART_LINES_ADD = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartShape }
      userErrors { field message }
    }
  }
`;

export const CART_LINES_UPDATE = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartShape }
      userErrors { field message }
    }
  }
`;

export const CART_LINES_REMOVE = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartShape }
      userErrors { field message }
    }
  }
`;
