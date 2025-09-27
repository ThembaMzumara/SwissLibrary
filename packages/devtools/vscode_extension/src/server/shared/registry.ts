/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * Shared registries for tags, attributes, and events.
 */

export const knownHtmlTags: Set<string> = new Set([
  'div','span','button','input','form','img','a','ul','ol','li','p',
  'h1','h2','h3','h4','h5','h6','header','footer','nav','main','section','article','aside'
]);

export const knownHtmlAttributes: Set<string> = new Set([
  'class','id','style','title','type','value','disabled','readonly','required','checked','multiple','selected','hidden','name','placeholder'
]);

export const knownDomEvents: string[] = [
  'click','input','change','submit','keyup','keydown','keypress','focus','blur','mouseenter','mouseleave','mouseover','mouseout'
];

// SwissJS DSL core tags/components (expand later)
export const knownSwissTags: Set<string> = new Set([
  'component','slot','template'
]);

// Placeholder for runtime-registered components; can be populated later from project context
export const knownSwissComponents: Set<string> = new Set([
  'custom-component',
  'swiss-app','swiss-layout','swiss-header','swiss-footer','swiss-sidebar','swiss-nav','swiss-button','swiss-input','swiss-form','swiss-card','swiss-modal'
]);

export function isKnownTag(name: string): boolean {
  return knownHtmlTags.has(name) || knownSwissTags.has(name) || knownSwissComponents.has(name);
}

export function isEventAttribute(name: string): boolean {
  return name.startsWith('on:') || name.startsWith('@');
}

export function isBindingAttribute(name: string): boolean {
  return name.startsWith(':');
}
