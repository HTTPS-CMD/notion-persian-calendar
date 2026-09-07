type NotionRichText = { plain_text?: string };
type NotionProperty = {
  type?: string;
  title?: NotionRichText[];
  rich_text?: NotionRichText[];
  status?: { name?: string };
  select?: { name?: string };
  date?: { start?: string | null };
};

type NotionPage = {
  id: string;
  url: string;
  properties: Record<string, NotionProperty>;
};

const token = process.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_DATABASE_ID;

const titleProp = process.env.NOTION_TITLE_PROPERTY || "Post";
const dateProp = process.env.NOTION_DATE_PROPERTY || "Date 1";
const statusProp = process.env.NOTION_STATUS_PROPERTY || "Status8";
const typeProp = process.env.NOTION_TYPE_PROPERTY || "Type";
const topicProp = process.env.NOTION_TOPIC_PROPERTY || "Topic";
const visibleStatus = process.env.NOTION_VISIBLE_STATUS || "ارسال شده";

function text(prop?: NotionProperty) {
  if (!prop) return "";
  if (prop.title) return prop.title.map(x => x.plain_text || "").join("");
  if (prop.rich_text) return prop.rich_text.map(x => x.plain_text || "").join("");
  if (prop.status?.name) return prop.status.name;
  if (prop.select?.name) return prop.select.name;
  return "";
}

function status(prop?: NotionProperty) {
  return prop?.status?.name || prop?.select?.name || text(prop);
}

async function notionFetch(path: string, init: RequestInit = {}) {
  if (!token) throw new Error("NOTION_TOKEN در Environment Variables تنظیم نشده است.");
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": process.env.NOTION_VERSION || "2025-09-03",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion API ${res.status}: ${body}`);
  }
  return res.json();
}

async function getDataSourceId(): Promise<string> {
  if (!databaseId) throw new Error("NOTION_DATABASE_ID در Environment Variables تنظیم نشده است.");

  // New Notion API: a database contains one or more data sources.
  try {
    const db = await notionFetch(`/databases/${databaseId}`);
    const id = db.data_sources?.[0]?.id;
    if (id) return id;
  } catch {
    // Fall back to treating NOTION_DATABASE_ID as a legacy database ID.
  }
  return databaseId;
}

export async function queryNotion() {
  const dataSourceId = await getDataSourceId();

  const body = {
    page_size: 100,
    filter: {
      property: statusProp,
      status: { equals: visibleStatus }
    },
  };

  let result: any;
  try {
    result = await notionFetch(`/data_sources/${dataSourceId}/query`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch {
    // Compatibility fallback for older Notion API/workspaces.
    result = await notionFetch(`/databases/${dataSourceId}/query`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  const pages: NotionPage[] = result.results || [];

  return pages
    .map(page => {
      const p = page.properties || {};
      return {
        id: page.id,
        title: text(p[titleProp]) || "بدون عنوان",
        date: p[dateProp]?.date?.start || "",
        status: status(p[statusProp]),
        type: text(p[typeProp]),
        topic: text(p[topicProp]),
        url: page.url,
      };
    })
    .filter(item => item.date);
}