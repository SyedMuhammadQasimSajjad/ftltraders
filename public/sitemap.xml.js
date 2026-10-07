export async function onRequest({ env }) {
    try {
        // Fetch only the IDs from your database to keep it lightweight
        const { results } = await env.DB.prepare("SELECT id FROM products").all();

        const baseUrl = "https://ftltraders.com";

        // Start building the XML string, starting with your homepage
        let xmlList = `
            <url>
                <loc>${baseUrl}/</loc>
                <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
                <changefreq>daily</changefreq>
                <priority>1.00</priority>
            </url>
        `;

        // Loop through your database and create a link for every single laptop
        if (results && results.length > 0) {
            results.forEach(product => {
                xmlList += `
<url>
    <loc>https://ftltraders.com/product-detail?id=${product.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
</url>`;
            });
        }

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            ${xmlList}
        </urlset>`;

        // Return the XML file directly to the browser or Googlebot
        return new Response(sitemap, {
            headers: {
                "Content-Type": "application/xml",
                "Cache-Control": "max-age=3600" // Caches the sitemap for 1 hour to save database reads
            }
        });
    } catch (error) {
        return new Response("Error generating sitemap", { status: 500 });
    }
}