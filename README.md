# Outbound Campaign Regression Automation

## Overview

This repository contains the initial R&D work for automating regression testing for the **Outbound Campaign** module in the Actyvate platform.

The goal is to validate the core outbound campaign flow through automation, starting from lead creation and campaign scheduling to communication verification and timeline updates.

## Background

Based on the team meeting discussion, the project lead proposed creating an automated regression test script for Outbound Campaigns.

Since this is currently an R&D and development-oriented task, the QA team is contributing by researching automation approaches and gradually implementing the planned scenarios. The team is currently at a beginner level in automation testing, so the focus is on learning, validating feasibility, and building the script step by step.

## Regression Test Scope

The automation script will cover the following scenarios:

1. Create a lead for an outbound campaign using API.
2. Schedule the outbound campaign immediately.
3. Wait for the configured communication trigger time.
4. Verify whether the lead has been communicated with after the expected time.
5. Confirm whether the lead has been created successfully in the Actyvate system.
6. Send one test email through the script.
7. Verify whether the email response is received.
8. Check whether the lead timeline has been updated correctly.

## Current Status

This task is currently in the research and implementation phase.

The QA team will continue to share updates as progress is made on:

- API flow validation
- Script structure
- Test data handling
- Email communication verification
- Timeline validation
- Regression execution process

## Privacy and Security Guidelines

To protect sensitive information, the following rules must be followed:

- Do not commit API tokens, passwords, credentials, or secret keys.
- Do not commit real client data, real lead data, or personal information.
- Use dummy/test lead details only.
- Store environment-specific values in `.env` files.
- Add `.env` to `.gitignore`.
- Use placeholder values in documentation and sample files.
- Avoid exposing internal URLs publicly unless approved.
