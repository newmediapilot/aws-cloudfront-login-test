function handler(event) {
    var request = event.request;
    var cookies = request.cookies;
    var auth = cookies.auth && cookies.auth.value;

    if (auth === "valid-user") {
        request.headers["x-auth-status"] = { value: "allowed" };
        return request;
    }

    return {
        statusCode: 302,
        statusDescription: "Found",
        headers: {
            location: { value: "/login/index.html" },
            "x-auth-status": { value: "blocked" }
        }
    };
}