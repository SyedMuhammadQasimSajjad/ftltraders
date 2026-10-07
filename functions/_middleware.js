export async function onRequest({ request, env, next }) {
    const url = new URL(request.url);

    // 1. Only protect /admin and /manage routes
    if (
        url.pathname.startsWith('/admin') ||
        url.pathname.startsWith('/manage')
    ) {
        //  CRITICAL FIX: If variables are missing, show an error instead of looping the login box
        if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
            return new Response('Authentication is not configured correctly on the server (Missing Environment Variables).', {
                status: 500
            });
        }

        const authorizationHeader = request.headers.get('authorization');


        if (authorizationHeader && authorizationHeader.startsWith('Basic ')) {
            try {
                // Safely extract and decode the base64 string
                const basicAuth = authorizationHeader.split(' ')[1];
                const decodedString = atob(basicAuth);


                const separatorIndex = decodedString.indexOf(':');
                const user = decodedString.substring(0, separatorIndex);
                const password = decodedString.substring(separatorIndex + 1);

                const validUser = env.ADMIN_USERNAME;
                const validPassword = env.ADMIN_PASSWORD;

                if (user === validUser && password === validPassword) {

                    const response = await next();

                    // Clone response to safely inject anti-caching headers
                    const noCacheResponse = new Response(response.body, response);
                    noCacheResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                    noCacheResponse.headers.set('Pragma', 'no-cache');
                    noCacheResponse.headers.set('Expires', '0');

                    return noCacheResponse;
                }
            } catch (error) {
                console.error("Auth decoding failed:", error.message);
            }
        }


        return new Response('Unauthorized Access. Please log in.', {
            status: 401,
            headers: {
                'WWW-Authenticate': 'Basic realm="FTL Traders Secure Admin"',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            },
        });
    }

    // 2. If it is a public page (like index.html), load it normally
    return next();
}