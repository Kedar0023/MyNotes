// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeNext from 'starlight-theme-next'

// https://astro.build/config
export default defineConfig({
    site: 'https://Kedar0023.github.io',
    base: '/MyNotes',
	integrations: [
		starlight({
			plugins: [starlightThemeNext()],
			title: 'Notes',
			customCss: ['./src/styles/global.css'],
			sidebar: [
				{
					label: 'Git',
					items: [{ autogenerate: { directory: 'notes/git' } }],
				},
				{
					label: 'Docker',
					items: [{ autogenerate: { directory: 'notes/docker' } }],
				},
				{
					label: 'Bitwise',
					items: [{ autogenerate: { directory: 'notes/bitwise' } }],
				},
			],
		}),
	],
});
