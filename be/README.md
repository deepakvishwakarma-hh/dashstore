# 🚀 Getting started with Strapi

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```

## 📊 Dashboard APIs

The `/api/dashboard/sales/overview` endpoint aggregates the `sales`, `stores`, `products`, and `categories` tables to provide the datasets that currently power the main dashboard in the frontend.

- **Method:** `GET`
- **Query Params (optional):**
- `filterType`: `yearly` | `monthly` | `weekly` | `daily` | `yesterday` | `custom` | `all` (default: `yearly`)
  - `year`: numeric year to scope `yearly` / `monthly` data (defaults to the most recent year with data)
  - `month`: zero-based month index for `monthly` filter (defaults to the first month that has data in the selected year)
  - `fromDate` / `toDate`: `YYYY-MM-DD` strings required when `filterType=custom`
  - `storeIds`: comma separated store ids to limit calculations to specific locations
- **Response Outline:**
  - `filter`: resolved filter metadata (type, year, month, applied range, store filters)
  - `metadata`: available years/months, store catalog with total sales, and defaults for the UI
  - `totals`: total quantity, store count, today sales, previous period comparison, and target projection
  - `highlights`: top categories/products (top 3)
  - `charts`: datasets needed to render the line, donut, bar, and leaderboard charts (sales stats, monthly series, category distribution, top stores, etc.)
  - `stores`: ranking + richer breakdown for the top 5 stores (category/product/month splits)

> 🔐 Remember to grant the desired Strapi roles access to `GET /dashboard/sales/overview` from the **Content-Type Builder → Permissions** screen before calling the endpoint from the frontend.

### Store Comparison API

`GET /dashboard/sales/store-comparison` powers the Store Comparison page.

- **Query Params (optional):**
  - `filterType`, `year`, `month`, `fromDate`, `toDate`: same semantics as the overview endpoint
  - `storeSlugs`: comma separated store slugs to compare (defaults to the top 3 stores if omitted)
- **Response Outline:**
  - `filter`: resolved filter metadata plus the applied store slugs
  - `metadata`: available years/months, selectable stores (id/name/slug/total), and default store selections
  - `stores`: per-store totals, top category/product, and category/product/monthly breakdowns
  - `charts.comparison`: normalized months plus per-store series for the comparison line chart
  - `totals`: summary counts such as total stores included and aggregate quantity

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project including [Strapi Cloud](https://cloud.strapi.io). Browse the [deployment section of the documentation](https://docs.strapi.io/dev-docs/deployment) to find the best solution for your use case.

```
yarn strapi deploy
```

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>
