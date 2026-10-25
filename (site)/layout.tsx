import { getSessionUser } from '@/lib/auth/session';
import { canBypassMaintenance } from '@/lib/auth/maintenance';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TitleSync from '@/components/TitleSync';
import HeroSlider from '@/components/Slider';
import MaintenanceScreen from '@/components/MaintenanceScreen';
import { SiteTheme } from '@/lib/db/models/SiteTheme';
import { connectDB } from '@/lib/db/connect';
import { getSystemSettings } from '@/lib/db/models/SystemSettings';
import SiteLangRoot from '@/components/SiteLangRoot';
import PageTransition from '@/components/PageTransition';
import Reveal from '@/components/Reveal';
import ClickSpark from '@/components/ClickSpark';
import CopiedToast from '@/components/CopiedToast';
import { generateTheme, invertGeneratedTheme, isDark } from '@/lib/theme/colorUtils';
export const dynamic = 'force-dynamic';
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  await connectDB();
  const [rawTheme, settings] = await Promise.all([
    SiteTheme.findOne().lean(),
    getSystemSettings(),
  ]);
  const bg       = rawTheme?.colors?.bg      || '#f1f5f9';
  const accent   = rawTheme?.colors?.accent  || '#3b4a9e';
  const navbarBg = rawTheme?.navbar?.bg      || '#ffffff';
  const t = generateTheme(bg, accent, navbarBg);
  const inv = invertGeneratedTheme(t);
  const baseMode = isDark(t.bg) ? 'dark' : 'light';
  const customCss = rawTheme?.customCss || '';
  const heroBg    = rawTheme?.images?.heroBg || '';
  const themeCSS = `
html,
html[data-theme],
html[data-theme="light"],
html[data-theme="navy"],
html[data-theme="dark"],
html[data-theme="gray"],
:root {
  --bg: #f7ce9e !important;
  --bg-elevated: #f1b978 !important;
  --bg-hover: #e8b07a !important;
  --border: #d88a67 !important;
  --text: #632811 !important;
  --text-muted: #8c502e !important;
  --accent: ${t.accent} !important;
  --accent-hover: ${t.accentHover} !important;
  --on-accent: ${t.accentOn} !important;
  --navbar-bg: ${t.navbarBg} !important;
  --navbar-text: ${t.navbarText} !important;
  --navbar-active-color: ${t.navbarActiveColor} !important;
  --navbar-active-bg: ${t.navbarActiveBg} !important;
  --navbar-border: ${t.navbarBorderColor} !important;
  --footer-bg: ${t.footerBg} !important;
}
[data-site][data-site-color="invert"] {
  --bg: ${inv.bg} !important;
  --bg-elevated: ${inv.bgElevated} !important;
  --bg-hover: ${inv.bgHover} !important;
  --border: ${inv.border} !important;
  --text: ${inv.text} !important;
  --text-muted: ${inv.textMuted} !important;
  --navbar-bg: ${inv.navbarBg} !important;
  --navbar-text: ${inv.navbarText} !important;
  --navbar-active-color: ${inv.navbarActiveColor} !important;
  --navbar-active-bg: ${inv.navbarActiveBg} !important;
  --navbar-border: ${inv.navbarBorderColor} !important;
  --footer-bg: ${inv.footerBg} !important;
  background-color: ${inv.bg} !important;
  color: ${inv.text} !important;
}
html, body {
  background-color: ${t.bg} !important;
  color: ${t.text} !important;
}
[data-site] {
  background-color: var(--bg) !important;
  color: var(--text) !important;
}
html[data-theme],
html[data-theme="light"],
html[data-theme="navy"],
html[data-theme="dark"],
html[data-theme="gray"] {
  --bg: ${t.bg} !important;
  --bg-elevated: ${t.bgElevated} !important;
  --text: ${t.text} !important;
  --text-muted: ${t.textMuted} !important;
}
html::-webkit-scrollbar,
body::-webkit-scrollbar,
*::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}
html::-webkit-scrollbar-track,
body::-webkit-scrollbar-track,
*::-webkit-scrollbar-track {
  background: ${t.bg};
}
html::-webkit-scrollbar-thumb,
body::-webkit-scrollbar-thumb,
*::-webkit-scrollbar-thumb {
  background: ${t.accent};
  border-radius: 999px;
  border: 3px solid ${t.bg};
}
html::-webkit-scrollbar-thumb:hover,
body::-webkit-scrollbar-thumb:hover,
*::-webkit-scrollbar-thumb:hover {
  background: ${t.accentHover};
}
${customCss}
`.trim();
  const dir = settings.rtlEnabled ? 'rtl' : 'ltr';
  const gaId = settings.googleAnalytics || '';
  const cfToken = settings.cloudflareAnalyticsToken || '';
  const tawkPropId = settings.tawkToPropertyId || '';
  const tawkWidgetId = settings.tawkToWidgetId || '';
  const crispId = settings.crispWebsiteId || '';
  const tawkScript = tawkPropId && tawkWidgetId ? `
    var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
    (function(){
      var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
      s1.async=true;
      s1.src='https://embed.tawk.to/${tawkPropId}/${tawkWidgetId}';
      s1.charset='UTF-8';
      s1.setAttribute('crossorigin','*');
      s0.parentNode.insertBefore(s1,s0);
    })();
  ` : '';
  const crispScript = crispId ? `
    window.$crisp=[];window.CRISP_WEBSITE_ID="${crispId}";
    (function(){var d=document;var s=d.createElement("script");
    s.src="https://client.crisp.chat/l.js";
    s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();
  ` : '';
  return (
    <>
      <style id="site-theme" dangerouslySetInnerHTML={{ __html: themeCSS }} />
      {gaId && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
          <script dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`
          }} />
        </>
      )}
      {cfToken && (
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={`{"token": "${cfToken}"}`}
        />
      )}
      {tawkScript && (
        <script dangerouslySetInnerHTML={{ __html: tawkScript }} />
      )}
      {crispScript && (
        <script dangerouslySetInnerHTML={{ __html: crispScript }} />
      )}
      <SiteLangRoot>
      {settings.maintenanceMode && !canBypassMaintenance(user) ? (
        <MaintenanceScreen
          message={settings.maintenanceMessage || ''}
          siteName={settings.siteName}
          showLogin
        />
      ) : (
      <div
        data-site
        data-site-base={baseMode}
        data-site-color="base"
        dir={dir}
        style={{
          ['--on-accent' as string]: t.accentOn,
          backgroundColor: '#f7ce9e',
          minHeight: '100vh',
          overflowX: 'hidden',
          color: '#3f2a1d',
        }}
      >
        <TitleSync />
        <Navbar initialUser={user} heroBg={heroBg} />
        <HeroSlider />
        <PageTransition />
              <Reveal />
              <ClickSpark />
              <div>{children}</div>
        <CopiedToast />
        <Footer />
      </div>
      )}
      </SiteLangRoot>
    </>
  );
}