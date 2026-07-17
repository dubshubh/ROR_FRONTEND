export type SiteLogo = {
  publicId: string;
  url: string;
} | null;

export type SiteSettings = {
  logo: SiteLogo;
  commandCenter: {
    launchTitle: string;
    launchDetails: string;
    membersCount: string;
    runsCount: string;
  };
};
