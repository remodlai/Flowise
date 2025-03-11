# Import understandings regarding images and files

**CRITICAL: We must always be designing for both internal (within the main platform ui) and external (access happening via an api key)**


## Basic image uploads during a chat session

Most models that we support support image uploads.  This is able to be enabled on the ChatModel node within a given flow (either chatflow or agentflow).


the `/predictions` endpoint is what is called when a new message is sent to a given flow.

This endpoint supports an `uploads` array. The following is from our swagger.yml:


```
Prediction:
            type: object
            properties:
                appId:
                    type: string
                    description: Application ID for a given Remodl AI Platform application
                orgId:
                    type: string
                    description: Organization ID for a given Remodl AI Platform organization
                userId:
                    type: string
                    description: User ID for a given Remodl AI Platform Application user
                question:
                    type: string
                    description: The question being asked
                overrideConfig:
                    type: object
                    description: The configuration to override the default prediction settings (optional)
                history:
                    type: array
                    description: The history messages to be prepended (optional)
                    items:
                        type: object
                        properties:
                            role:
                                type: string
                                enum: [apiMessage, userMessage]
                                description: The role of the message
                                example: apiMessage
                            content:
                                type: string
                                description: The content of the message
                                example: 'Hello, how can I help you?'
                uploads:
                    type: array
                    items:
                        type: object
                        properties:
                            type:
                                type: string
                                enum: [audio, url, file, file:rag, file:full]
                                description: The type of file upload
                                example: file
                            name:
                                type: string
                                description: The name of the file or resource
                                example: 'image.png'
                            data:
                                type: string
                                description: The base64-encoded data or URL for the resource
                                example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABjElEQVRIS+2Vv0oDQRDG'
                            mime:
                                type: string
                                description: The MIME type of the file or resource
                                example: 'image/png'
```
