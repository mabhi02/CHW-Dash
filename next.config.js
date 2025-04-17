/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    // Disable static optimization for problematic paths
    // This will ensure they're rendered at runtime instead
    experimental: {
        optimizeCss: true,
    },
    // Exclude certain pages from static generation
    exportPathMap: async function (
        defaultPathMap,
        { dev, dir, outDir, distDir, buildId }
    ) {
        // Remove problematic paths from static generation
        delete defaultPathMap['/pdf-viewer'];
        delete defaultPathMap['/direct-pdf'];
        delete defaultPathMap['/find-in-pdf'];
        
        return defaultPathMap;
    }
}

module.exports = nextConfig