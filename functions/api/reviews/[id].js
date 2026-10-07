export async function onRequestGet({ env, params }) {
    try {
        const productId = params.id;

        const { results } = await env.DB.prepare(
            "SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC"
        ).bind(productId).all();

        return Response.json(results);
    } catch (err) {
        return Response.json({ error: "Failed to fetch reviews: " + err.message }, { status: 500 });
    }
}

export async function onRequestDelete({ env, params }) {
    try {
        const id = params.id;

        await env.DB.prepare("DELETE FROM reviews WHERE id = ?").bind(id).run();

        return Response.json({ message: "Review deleted successfully" });
    } catch (err) {
        return Response.json({ error: 'Server error deleting review: ' + err.message }, { status: 500 });
    }
}