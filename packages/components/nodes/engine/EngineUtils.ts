import { Metadata, NodeWithScore } from 'llamaindex'
import { IDocument } from '../../src/Interface'

export const reformatSourceDocuments = (sourceNodes: NodeWithScore<Metadata>[]): IDocument[] => {
    const sourceDocuments: IDocument[] = []
    for (const node of sourceNodes) {
        sourceDocuments.push({
            pageContent: (node.node as any).text,
            metadata: node.node.metadata
        })
    }
    return sourceDocuments
}
