import {
    DefaultCrudRepository,
    juggler,
    DataObject,
    Options,
    Filter,
    Where,
    Count
} from "@loopback/repository";

import { HistoryEntity, HistoryEntityRelations } from "../models";

export interface HistoryOptions extends Options {
    crud?: true;
    date?: Date;
}
export class HistoryCrudRepository<
    Model extends HistoryEntity,
    ModelRelations extends HistoryEntityRelations
> extends DefaultCrudRepository<Model, string, ModelRelations> {
    constructor(
        entityClass: typeof HistoryEntity & {
            prototype: Model;
        },
        dataSource: juggler.DataSource
    ) {
        super(entityClass, dataSource);
    }

    /**
     * Create methods
     */
    private async createHistory(
        entities: DataObject<Model>[],
        options?: HistoryOptions
    ): Promise<Model[]> {
        /**
         * create(uid:null,beginDate:$now,endDate:null,id:null)
         */
        const date = new Date();

        return super.createAll(
            entities.map(entity => ({
                ...entity,
                uid: undefined,
                beginDate: date,
                endDate: null,
                id: undefined
            })),
            options
        );
    }
    async create(
        entity: DataObject<Model>,
        options?: HistoryOptions
    ): Promise<Model> {
        if (options && options.crud) {
            return super.create(entity, options);
        }

        return (await this.createHistory([entity], options))[0];
    }
    async createAll(
        entities: DataObject<Model>[],
        options?: HistoryOptions
    ): Promise<Model[]> {
        if (options && options.crud) {
            return super.createAll(entities, options);
        }

        return this.createHistory(entities, options);
    }

    /**
     * Read methods
     */
    async find(
        filter?: Filter<Model>,
        HistoryOptions?: HistoryOptions
    ): Promise<(Model & ModelRelations)[]> {
        return super.find(filter, HistoryOptions);
    }
    async findOne(
        filter?: Filter<Model>,
        HistoryOptions?: HistoryOptions
    ): Promise<(Model & ModelRelations) | null> {
        return super.findOne(filter, HistoryOptions);
    }
    async findById(
        id: string,
        filter?: Filter<Model>,
        HistoryOptions?: HistoryOptions
    ): Promise<Model & ModelRelations> {
        return super.findById(id, filter, HistoryOptions);
    }
    async count(
        where?: Where<Model>,
        HistoryOptions?: HistoryOptions
    ): Promise<Count> {
        return super.count(where, HistoryOptions);
    }
    async exists(
        id: string,
        HistoryOptions?: HistoryOptions
    ): Promise<boolean> {
        return super.exists(id, HistoryOptions);
    }

    /**
     * Update methods
     */
    private async updateHistory(
        data: DataObject<Model>,
        replace: boolean,
        where: Where,
        options?: HistoryOptions
    ): Promise<Count> {
        /**
         * where: {id:id,endDate:null}
         * select(where)
         * create(uid:null,beginDate:$now,endDate:null)
         * update(where) => endDate: $now
         */
        const date = new Date();

        const entities = await super.find(where as any, options);

        await super.createAll(
            entities.map(entity => ({
                ...(replace ? {} : entity),
                ...data,
                uid: undefined,
                beginDate: date,
                endDate: null,
                id: entity.id
            })),
            options
        );

        return await super.updateAll(
            { endDate: date } as any,
            {
                uid: { inq: entities.map(entity => entity.uid) }
            } as any,
            options
        );
    }
    async update(entity: Model, options?: HistoryOptions): Promise<void> {
        if (options && options.crud) {
            return super.update(entity, options);
        }

        await this.updateHistory(
            entity,
            false,
            {
                id: entity.id,
                endDate: null
            },
            options
        );
    }
    async updateAll(
        data: DataObject<Model>,
        where?: Where<Model>,
        options?: HistoryOptions
    ): Promise<Count> {
        if (options && options.crud) {
            return super.updateAll(data, where, options);
        }

        return this.updateHistory(
            data,
            false,
            {
                and: [where, { endDate: null }]
            },
            options
        );
    }
    async updateById(
        id: string,
        data: DataObject<Model>,
        options?: HistoryOptions
    ): Promise<void> {
        if (options && options.crud) {
            return super.updateById(id, data, options);
        }

        await this.updateHistory(
            data,
            false,
            {
                id: id,
                endDate: null
            },
            options
        );
    }
    async replaceById(
        id: string,
        data: DataObject<Model>,
        options?: HistoryOptions
    ): Promise<void> {
        if (options && options.crud) {
            return super.replaceById(id, data, options);
        }

        await this.updateHistory(
            data,
            true,
            {
                id: id,
                endDate: null
            },
            options
        );
    }

    /**
     * Delete methods
     */
    private async deleteHistory(
        where: Where,
        options?: HistoryOptions
    ): Promise<Count> {
        /**
         * where: {id:id,endDate:null}
         * update(where) => endDate: $now
         */
        return super.updateAll(
            { endDate: new Date() } as any,
            where as any,
            options
        );
    }
    async delete(entity: Model, options?: HistoryOptions): Promise<void> {
        if (options && options.crud) {
            return super.delete(entity, options);
        }

        await this.deleteHistory({ id: entity.id, endDate: null }, options);
    }
    async deleteAll(
        where?: Where<Model>,
        options?: HistoryOptions
    ): Promise<Count> {
        if (options && options.crud) {
            return super.deleteAll(where, options);
        }

        return this.deleteHistory(
            {
                and: [
                    where,
                    {
                        endDate: null
                    }
                ]
            },
            options
        );
    }
    async deleteById(id: string, options?: HistoryOptions): Promise<void> {
        if (options && options.crud) {
            return super.deleteById(id, options);
        }

        await this.deleteHistory({ id: id, endDate: null }, options);
    }
}
