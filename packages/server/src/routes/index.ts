import express from 'express'
import apikeyRouter from './apikey'
import assistantsRouter from './assistants'
import attachmentsRouter from './attachments'
import chatMessageRouter from './chat-messages'
import chatflowsRouter from './chatflows'
import chatflowsStreamingRouter from './chatflows-streaming'
import chatflowsUploadsRouter from './chatflows-uploads'
import componentsCredentialsRouter from './components-credentials'
import componentsCredentialsIconRouter from './components-credentials-icon'
import credentialsRouter from './credentials'
import documentStoreRouter from './documentstore'
import exportImportRouter from './export-import'
import feedbackRouter from './feedback'
import fetchLinksRouter from './fetch-links'
import flowConfigRouter from './flow-config'
import getUploadFileRouter from './get-upload-file'
import getUploadPathRouter from './get-upload-path'
import internalChatmessagesRouter from './internal-chat-messages'
import internalPredictionRouter from './internal-predictions'
import leadsRouter from './leads'
import loadPromptRouter from './load-prompts'
import marketplacesRouter from './marketplaces'
import nodeConfigRouter from './node-configs'
import nodeCustomFunctionRouter from './node-custom-functions'
import nodeIconRouter from './node-icons'
import nodeLoadMethodRouter from './node-load-methods'
import nodesRouter from './nodes'
import openaiAssistantsRouter from './openai-assistants'
import openaiAssistantsFileRouter from './openai-assistants-files'
import openaiAssistantsVectorStoreRouter from './openai-assistants-vector-store'
import openaiRealtimeRouter from './openai-realtime'
import pingRouter from './ping'
import predictionRouter from './predictions'
import promptListsRouter from './prompts-lists'
import publicChatbotRouter from './public-chatbots'
import publicChatflowsRouter from './public-chatflows'
import secretsRouter from './secrets'
import statsRouter from './stats'
import toolsRouter from './tools'
import upsertHistoryRouter from './upsert-history'
import variablesRouter from './variables'
import vectorRouter from './vectors'
import verifyRouter from './verify'
import versionRouter from './versions'
import loginRouter from './auth/login'
import usersRouter from './auth/users'
import supabaseTokenRouter from './auth/supabase-token'
import magicLinkRouter from './auth/magic-link'
import callbackRouter from './auth/callback'
import logoutRouter from './auth/logout'
import refreshTokenRouter from './auth/refresh-token'
import adminRouter from './admin'
import customRolesRouter from './custom-roles'
import permissionsRouter from './permissions'
import usersCustomRolesRouter from './users'

const router = express.Router()

router.use('/ping', pingRouter)
router.use('/apikey', apikeyRouter)
router.use('/assistants', assistantsRouter)
router.use('/attachments', attachmentsRouter)
router.use('/chatflows', chatflowsRouter)
router.use('/chatflows-streaming', chatflowsStreamingRouter)
router.use('/chatmessage', chatMessageRouter)
router.use('/components-credentials', componentsCredentialsRouter)
router.use('/components-credentials-icon', componentsCredentialsIconRouter)
router.use('/chatflows-uploads', chatflowsUploadsRouter)
router.use('/credentials', credentialsRouter)
router.use('/document-store', documentStoreRouter)
router.use('/export-import', exportImportRouter)
router.use('/feedback', feedbackRouter)
router.use('/fetch-links', fetchLinksRouter)
router.use('/flow-config', flowConfigRouter)
router.use('/internal-chatmessage', internalChatmessagesRouter)
router.use('/internal-prediction', internalPredictionRouter)
router.use('/get-upload-file', getUploadFileRouter)
router.use('/get-upload-path', getUploadPathRouter)
router.use('/leads', leadsRouter)
router.use('/load-prompt', loadPromptRouter)
router.use('/marketplaces', marketplacesRouter)
router.use('/node-config', nodeConfigRouter)
router.use('/node-custom-function', nodeCustomFunctionRouter)
router.use('/node-icon', nodeIconRouter)
router.use('/node-load-method', nodeLoadMethodRouter)
router.use('/nodes', nodesRouter)
router.use('/openai-assistants', openaiAssistantsRouter)
router.use('/openai-assistants-file', openaiAssistantsFileRouter)
router.use('/openai-assistants-vector-store', openaiAssistantsVectorStoreRouter)
router.use('/openai-realtime', openaiRealtimeRouter)
router.use('/prediction', predictionRouter)
router.use('/prompts-list', promptListsRouter)
router.use('/public-chatbotConfig', publicChatbotRouter)
router.use('/public-chatflows', publicChatflowsRouter)
router.use('/secrets', secretsRouter)
router.use('/stats', statsRouter)
router.use('/tools', toolsRouter)
router.use('/variables', variablesRouter)
router.use('/vector', vectorRouter)
router.use('/verify', verifyRouter)
router.use('/version', versionRouter)
router.use('/upsert-history', upsertHistoryRouter)
router.use('/auth/login', loginRouter)
router.use('/auth/users', usersRouter)
router.use('/auth/magic-link', magicLinkRouter)
router.use('/auth/callback', callbackRouter)
router.use('/auth/logout', logoutRouter)
router.use('/auth/refresh-token', refreshTokenRouter)
router.use('/auth', supabaseTokenRouter)
router.use('/admin', adminRouter)
router.use('/custom-roles', customRolesRouter)
router.use('/permissions', permissionsRouter)
router.use('/users', usersCustomRolesRouter)

export default router
