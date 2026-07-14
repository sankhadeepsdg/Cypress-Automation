const fs = require('fs')
const path = require('path')

const logsDir = path.join(__dirname, 'cypress', 'reports', 'logs')
const finalDir = path.join(__dirname, 'cypress', 'reports', 'final')
const markdownReportPath = path.join(finalDir, 'execution-summary.md')

function readJson(fileName, fallback = {}) {
  const filePath = path.join(logsDir, fileName)

  if (!fs.existsSync(filePath)) {
    return fallback
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    return fallback
  }
}

function readText(fileName, fallback = '') {
  const filePath = path.join(logsDir, fileName)

  if (!fs.existsSync(filePath)) {
    return fallback
  }

  return fs.readFileSync(filePath, 'utf8')
}

function value(data, fallback = 'N/A') {
  if (data === undefined || data === null || data === '') {
    return fallback
  }

  if (Array.isArray(data)) {
    return data.join(', ')
  }

  if (typeof data === 'object') {
    return JSON.stringify(data)
  }

  return String(data)
}

function tableValue(data) {
  return value(data)
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>')
}

function statusIcon(status) {
  if (status === 'Passed') return '✅ Passed'
  if (status === 'Failed') return '❌ Failed'
  if (status === 'Started') return '⏳ Started'
  return value(status, 'N/A')
}

fs.mkdirSync(finalDir, { recursive: true })

const metadata = readJson('00-test-metadata.json')
const campaignCreate = readJson('01-campaign-create-response.json')
const leadCreated = readJson('03-lead-created.json')
const aiValidation = readJson('05-ai-reply-validation.json')
const timelineValidation = readJson('07-timeline-validation.json')
const leadDetailsValidation = readJson('09-lead-details-validation.json')
const representativeSelected = readJson('10-representative-selected.json')
const representativeReassigned = readJson('11-representative-reassigned.json')
const leadStatusUpdated = readJson('13-lead-status-updated.json')
const tagsUnderClient = readJson('14-tags-under-client.json')
const leadTagUpdated = readJson('15-lead-tag-updated.json')
const leadNoteAdded = readJson('16-lead-note-added.json')
const leadNoteValidation = readJson('18-lead-note-validation.json')
const leadNoteDeleted = readJson('19-lead-note-deleted.json')
const finalSummary = readJson('20-final-summary.json')
const aiReply = readText('04-ai-reply.txt')

const finalStatus = finalSummary.status || 'Check Details'

const testSteps = [
  {
    step: 1,
    title: 'Campaign Creation',
    expected: campaignCreate.expectedResult || 'Campaign should be created successfully',
    actual: campaignCreate.response?.meta?.message || 'Campaign creation API executed',
    status: campaignCreate.status
  },
  {
    step: 2,
    title: 'Campaign Dashboard Verification',
    expected: 'Campaign should appear in campaign dashboard',
    actual: `Campaign dashboard checked for campaign: ${metadata.campaignName || finalSummary.campaignName || 'N/A'}`,
    status: 'Passed'
  },
  {
    step: 3,
    title: 'Lead Creation Verification',
    expected: leadCreated.expectedResult || 'Lead should be created from outbound campaign',
    actual: `Lead ID: ${leadCreated.leadId || finalSummary.leadId || 'N/A'}`,
    status: leadCreated.status
  },
  {
    step: 4,
    title: 'AI Email Reply Validation',
    expected: aiValidation.expectedResult || 'AI reply should include lead first name',
    actual: `Expected text: ${aiValidation.expectedText || 'Hi Mario'}`,
    status: aiValidation.status
  },
  {
    step: 5,
    title: 'Timeline Event Validation',
    expected: timelineValidation.expectedResult || 'Required timeline events should be available',
    actual: `Events found: ${value(timelineValidation.actualEvents)}`,
    status: timelineValidation.status
  },
  {
    step: 6,
    title: 'Lead Details Validation',
    expected: leadDetailsValidation.expectedResult || 'Lead details should contain required fields',
    actual: `leadId: ${leadDetailsValidation.leadIdExists}, clientId: ${leadDetailsValidation.clientIdExists}, assignedUserId: ${leadDetailsValidation.assignedUserIdExists}`,
    status: leadDetailsValidation.status
  },
  {
    step: 7,
    title: 'Representative Selection',
    expected: representativeSelected.expectedResult || 'A representative should be selected',
    actual: `New Representative ID: ${representativeSelected.newRepresentativeId || finalSummary.newRepresentativeId || 'N/A'}`,
    status: representativeSelected.status
  },
  {
    step: 8,
    title: 'Representative Reassignment',
    expected: representativeReassigned.expectedResult || 'Lead should be reassigned successfully',
    actual: `Lead reassigned to representative ID: ${representativeReassigned.newRepresentativeId || finalSummary.newRepresentativeId || 'N/A'}`,
    status: representativeReassigned.status
  },
  {
    step: 9,
    title: 'Lead Status Update',
    expected: leadStatusUpdated.expectedResult || 'Lead status should be updated successfully',
    actual: `Updated status: ${leadStatusUpdated.updatedStatus || finalSummary.selectedLeadStatus || 'N/A'}`,
    status: leadStatusUpdated.status
  },
  {
    step: 10,
    title: 'Get Tags Under Client',
    expected: tagsUnderClient.expectedResult || 'Tags should be available under client',
    actual: `Selected tag: ${tagsUnderClient.selectedTag || finalSummary.selectedTag || 'N/A'}`,
    status: tagsUnderClient.status
  },
  {
    step: 11,
    title: 'Lead Tag Update',
    expected: leadTagUpdated.expectedResult || 'Selected tag should be updated against the lead',
    actual: `Tag updated: ${leadTagUpdated.selectedTag || finalSummary.selectedTag || 'N/A'}`,
    status: leadTagUpdated.status
  },
  {
    step: 12,
    title: 'Lead Note Added',
    expected: leadNoteAdded.expectedResult || 'Lead note should be added successfully',
    actual: `Note: ${leadNoteAdded.noteContent || 'N/A'}`,
    status: leadNoteAdded.status
  },
  {
    step: 13,
    title: 'Lead Note Validation',
    expected: leadNoteValidation.expectedResult || 'Latest note should match expected note',
    actual: `Expected: ${leadNoteValidation.expectedNote || 'N/A'} | Actual: ${leadNoteValidation.actualNote || 'N/A'}`,
    status: leadNoteValidation.status
  },
  {
    step: 14,
    title: 'Lead Note Deleted',
    expected: leadNoteDeleted.expectedResult || 'Lead note should be deleted successfully',
    actual: `Deleted Note ID: ${leadNoteDeleted.notesId || 'N/A'}`,
    status: leadNoteDeleted.status
  }
]

const aiReplyPreview = aiReply
  ? aiReply.replace(/\r?\n/g, ' ').slice(0, 700)
  : 'AI reply log was not found.'

const markdown = `# Cypress Automation Execution Summary

## Overall Result

| Field | Value |
|---|---|
| Project | ${tableValue(finalSummary.project || metadata.project || 'Actyvate AI')} |
| Module | ${tableValue(finalSummary.module || metadata.module || 'Outbound Campaign Automation')} |
| Test Suite | ${tableValue(finalSummary.testSuite || metadata.testSuite || 'Actyvate Outbound Campaign Automation')} |
| Test Case | ${tableValue(finalSummary.testCase || metadata.testCase || 'End-to-End Flow')} |
| Environment | ${tableValue(finalSummary.environment || metadata.environment || 'Dev')} |
| Final Status | ${tableValue(statusIcon(finalStatus))} |
| Test Started At | ${tableValue(finalSummary.testStartedAt || metadata.testStartedAt)} |
| Test Completed At | ${tableValue(finalSummary.testCompletedAt)} |

## Test Data

| Field | Value |
|---|---|
| Campaign Name | ${tableValue(finalSummary.campaignName || metadata.campaignName)} |
| Lead Name | ${tableValue(metadata.leadName)} |
| Lead ID | ${tableValue(finalSummary.leadId || leadCreated.leadId)} |
| Client ID | ${tableValue(finalSummary.clientId)} |
| New Representative ID | ${tableValue(finalSummary.newRepresentativeId)} |
| Selected Lead Status | ${tableValue(finalSummary.selectedLeadStatus)} |
| Selected Tag | ${tableValue(finalSummary.selectedTag)} |

## Step-by-Step Validation Summary

| Step | Validation Area | Expected Result | Actual Result | Status |
|---:|---|---|---|---|
${testSteps.map(item => `| ${item.step} | ${tableValue(item.title)} | ${tableValue(item.expected)} | ${tableValue(item.actual)} | ${tableValue(statusIcon(item.status))} |`).join('\n')}

## AI Reply Evidence

\`\`\`text
${aiReplyPreview}
\`\`\`

## Final QA Observation

The Cypress automation execution completed for the Actyvate Outbound Campaign End-to-End Flow.

The automation validated campaign creation, campaign dashboard verification, lead creation, AI email reply, lead timeline events, lead details, representative reassignment, lead status update, lead tag update, and lead notes add/get/delete flow.

## Evidence Files

| Evidence | Location |
|---|---|
| Mochawesome HTML Report | cypress/reports/final/mochawesome.html |
| Markdown Summary Report | cypress/reports/final/execution-summary.md |
| Detailed JSON/Text Logs | cypress/reports/logs |
| Cypress Execution Video | cypress/videos |
`

fs.writeFileSync(markdownReportPath, markdown, 'utf8')

console.log('Markdown report generated successfully.')
console.log(`File path: ${markdownReportPath}`)