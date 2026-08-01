function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getPublicEnv() {
  return {
    apiUrl: required(
      "NEXT_PUBLIC_CMS_API_URL",
      process.env.NEXT_PUBLIC_CMS_API_URL,
    ).replace(/\/$/, ""),
    siteKey: required(
      "NEXT_PUBLIC_CMS_SITE_KEY",
      process.env.NEXT_PUBLIC_CMS_SITE_KEY,
    ),
  };
}

export function getServerEnv() {
  return {
    ...getPublicEnv(),
    managementToken: required(
      "CMS_MANAGEMENT_TOKEN",
      process.env.CMS_MANAGEMENT_TOKEN,
    ),
    teacherPin: required("TEACHER_PIN", process.env.TEACHER_PIN),
    teacherSessionSecret: required(
      "TEACHER_SESSION_SECRET",
      process.env.TEACHER_SESSION_SECRET,
    ),
  };
}
