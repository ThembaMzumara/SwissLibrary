/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

export interface RemediationAdvice {
  message: string;
  url?: string;
}

/**
 * Provide a capability-aware remediation message for a runtime error.
 * This is dev-oriented guidance and may link into docs.
 */
export function getRemediationMessage(
  err: unknown,
  phase: string,
  component: { constructor: { name: string } },
  requiredCapabilities: string[]
): RemediationAdvice {
  const name = component?.constructor?.name ?? 'UnknownComponent';
  const capList = requiredCapabilities?.length ? requiredCapabilities.join(', ') : 'none';
  const msg = (err instanceof Error ? err.message : String(err || ''));

  // Simple heuristics; expand with specific error signatures as needed.
  if (/capab/i.test(msg)) {
    return {
      message: `Capability error in ${name} during ${phase}. Required: [${capList}]. Verify providers and configuration.`,
      url: '/development/plugins#capability-audit'
    };
  }
  if (/hydrate|hydration/i.test(msg)) {
    return {
      message: `Hydration issue in ${name} during ${phase}. Check server/client state parity and template output.`,
      url: '/development/plan#template-pipeline'
    };
  }
  return {
    message: `Error in ${name} during ${phase}. Review recent changes and component dependencies.`,
    url: '/development/workflow'
  };
}
