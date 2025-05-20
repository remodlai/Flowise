/* eslint-disable */
import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn } from 'typeorm'
import { IUpsertHistory } from '../../Interface'

@Entity()
export class UpsertHistory implements IUpsertHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Index()
    @Column()
    chatflowid: string

    @Column()
    result: string

    @Column()
    flowData: string

    @CreateDateColumn()
    date: Date

    @Column({ type: 'uuid' })
    applicationId: string;

    @Column({ type: 'uuid', nullable: true })
    organizationId: string | null;

    @Column({ type: 'uuid', nullable: true })
    userId: string | null;
}
