# Testing Cloudfront Functions

- This tiny build goes to an S3 bucket
- The bucket is attached to CloudFront
- CloudFront protects everything under `/admin`
- If you use login to set a cookie,
- CloudFront will permit access

> This is an extremely minimal representation of this paradigm.

## Auth Workflow (CloudFront + Cookie Gate)

1. User requests `/admin/index.html` through CloudFront.
2. CloudFront runs a Viewer Request function checks cookies.
3. If exists `auth` cookie - validate return allowed x-header.
4. If invalid, redirects to `/login.html`.
5. If valid, request content returned.