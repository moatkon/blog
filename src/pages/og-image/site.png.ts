import { siteConfig } from "@/site.config";
import { renderOgImage } from "@/utils/og-image";

export const GET = () =>
	renderOgImage(siteConfig.title, "Personal blog · Life, thoughts and products");
