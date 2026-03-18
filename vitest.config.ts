import { defineConfig } from 'vitest/config'

export default defineConfig({
        test: {
                include: ['**/*.test.ts'],
                exclude: ['node_modules/**', 'dist/**'],
                coverage: {
                        provider: 'v8',
                        include: ['index.ts'],
                        reporter: ['text', 'json', 'html'],
                        reportsDirectory: './logs/coverage',
                },
        },
})
