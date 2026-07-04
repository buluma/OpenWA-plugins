# Changelog

All notable changes to the **Welcome Greeter** plugin are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this plugin adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
The version here always matches `manifest.json`'s `version`.

## [Unreleased]

## [0.1.0] — 2026-07-04

First release.

### Added

- One-shot welcome message on a contact's first inbound message, with `{{contactName}}` and `{{chatId}}` template variables.
- Optional welcome media (image/video/audio) via `ctx.conversations.send`, with graceful text-only fallback on failure or
  on older OpenWA hosts.
- `greetInGroups` toggle (default off — direct chats only).
- `resetAfterDays` to re-greet after a period of inactivity (default `0` = once ever).
- `skipWhenGreetedByOther` for cross-plugin coordination via shared storage (default on).
- Least-privilege design: only `messages:send`, returns `{ continue: true }` so other plugins still process the message.
- Fail-fast config: a missing `welcomeText` surfaces as `ERROR` in the dashboard.
- i18n for es, fr, it, ar, he, te, zh-CN, zh-HK.
