import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn } from 'typeorm'
import { IApiKey } from '../../Interface'

@Entity('apikey')
export class ApiKey implements IApiKey {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'text' })
    apiKey: string

    @Column({ type: 'text' })
    apiSecret: string

    @Column({ type: 'text' })
    keyName: string

    @Column({ type: 'uuid' })
    applicationId: string;

    @Column({ type: 'uuid', nullable: true })
    organizationId: string | null;

    @Column({ type: 'uuid', nullable: true })
    userId: string | null;

    @CreateDateColumn({ type: 'timestamp' })
    createdDate: Date;

    @Column({ type: 'timestamp' })
    @UpdateDateColumn()
    updatedDate: Date
}
