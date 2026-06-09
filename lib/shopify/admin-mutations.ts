// Mutaciones de la Admin API para los flags de site_settings.
// El metaobjeto lo creó el amigo en Shopify Admin → Contenido → Metaobjetos.
// Aquí solo escribimos los campos `coming_soon_mode` y `early_access_password`.

import "server-only";
import { shopifyAdmin, type AdminResult } from "./admin-client";

type MetaobjectNode = {
  id: string;
  handle: string;
  fields: { key: string; value: string }[];
};

type FindResp = {
  metaobjects: { edges: { node: MetaobjectNode }[] };
};

const FIND = /* GraphQL */ `
  query FindSiteSettings {
    metaobjects(type: "site_settings", first: 1) {
      edges {
        node {
          id
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

type UpdateResp = {
  metaobjectUpdate: {
    metaobject: { id: string } | null;
    userErrors: { field: string[]; message: string }[];
  };
};

const UPDATE = /* GraphQL */ `
  mutation UpdateSiteSettings($id: ID!, $fields: [MetaobjectFieldInput!]!) {
    metaobjectUpdate(id: $id, metaobject: { fields: $fields }) {
      metaobject {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

type CreateResp = {
  metaobjectCreate: {
    metaobject: { id: string } | null;
    userErrors: { field: string[]; message: string }[];
  };
};

const CREATE = /* GraphQL */ `
  mutation CreateSiteSettings($fields: [MetaobjectFieldInput!]!) {
    metaobjectCreate(
      metaobject: { type: "site_settings", fields: $fields }
    ) {
      metaobject {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export type SiteSettingsPatch = {
  comingSoonMode?: boolean;
  earlyAccessPassword?: string;
};

export async function updateSiteSettings(
  patch: SiteSettingsPatch,
): Promise<AdminResult<{ id: string }>> {
  const found = await shopifyAdmin<FindResp>(FIND);
  if (!found.ok) return found;

  const fields: { key: string; value: string }[] = [];
  if (patch.comingSoonMode !== undefined) {
    fields.push({
      key: "coming_soon_mode",
      value: patch.comingSoonMode ? "true" : "false",
    });
  }
  if (patch.earlyAccessPassword !== undefined) {
    fields.push({
      key: "early_access_password",
      value: patch.earlyAccessPassword,
    });
  }
  if (fields.length === 0) {
    return { ok: false, error: "Nada que actualizar." };
  }

  const existing = found.data.metaobjects.edges[0]?.node;
  if (existing) {
    const res = await shopifyAdmin<UpdateResp>(UPDATE, {
      id: existing.id,
      fields,
    });
    if (!res.ok) return res;
    const errs = res.data.metaobjectUpdate.userErrors;
    if (errs.length) {
      return { ok: false, error: errs.map((e) => e.message).join(", ") };
    }
    const id = res.data.metaobjectUpdate.metaobject?.id;
    if (!id) return { ok: false, error: "Update sin id." };
    return { ok: true, data: { id } };
  }

  // No existe — crear con los campos pasados
  const res = await shopifyAdmin<CreateResp>(CREATE, { fields });
  if (!res.ok) return res;
  const errs = res.data.metaobjectCreate.userErrors;
  if (errs.length) {
    return { ok: false, error: errs.map((e) => e.message).join(", ") };
  }
  const id = res.data.metaobjectCreate.metaobject?.id;
  if (!id) return { ok: false, error: "Create sin id." };
  return { ok: true, data: { id } };
}
