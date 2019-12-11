import {
    DefaultCrudRepository,
    juggler,
    DataObject,
    Options,
    Filter,
    Where,
    Count,
    EntityNotFoundError
} from "@loopback/repository";

import { Ctor } from "../types";

import { HistoryEntity, HistoryEntityRelations } from "../models";

export interface HistoryOptions extends Options {
    crud?: true;
    maxDate?: Date;
}
export class HistoryCrudRepository<
    Model extends HistoryEntity,
    ModelRelations extends HistoryEntityRelations
> extends DefaultCrudRepository<Model, string, ModelRelations> {
    constructor(ctor: Ctor<Model>, dataSource: juggler.DataSource) {
        super(ctor, dataSource);
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
    private async findHistory(
        group: boolean,
        filter: Filter,
        options?: HistoryOptions
    ): Promise<(Model & ModelRelations)[]> {
        /**
         * where: {id:id,endDate<=date|endDate:null}
         * select(where)
         * group(beginDate:last)
         */
        let result = await super.find(filter as any, options);

        if (group) {
            // find last entities group by id and save last entities in object
            let lastEntities: any = {};
            result.forEach(entity => {
                if (
                    !lastEntities[entity.id] ||
                    lastEntities[entity.id].beginDate < entity.beginDate
                ) {
                    lastEntities[entity.id] = entity;
                }
            });

            // filter only last entity of every group (by id)
            result = result.filter(
                entity => lastEntities[entity.id].uid === entity.uid
            );
        }

        return result;
    }

    async find(
        filter?: Filter<Model>,
        options?: HistoryOptions
    ): Promise<(Model & ModelRelations)[]> {
        if (options && options.crud) {
            return super.find(filter, options);
        }

        const maxDate = options && options.maxDate;
        const endDateCondition = {
            endDate: maxDate ? { lt: maxDate } : null
        };
        return this.findHistory(
            Boolean(maxDate),
            {
                ...filter,
                where: {
                    and: [filter && filter.where, endDateCondition]
                }
            },
            options
        );
    }

    async findOne(
        filter?: Filter<Model>,
        options?: HistoryOptions
    ): Promise<(Model & ModelRelations) | null> {
        if (options && options.crud) {
            return super.findOne(filter, options);
        }

        const maxDate = options && options.maxDate;
        const endDateCondition = {
            endDate: maxDate ? { lt: maxDate } : null
        };
        const result = await this.findHistory(
            Boolean(maxDate),
            {
                ...filter,
                where: {
                    and: [filter && filter.where, endDateCondition]
                }
            },
            options
        );
        if (result[0]) {
            return result[0];
        }
        return null;
    }

    async findById(
        id: string,
        filter?: Filter<Model>,
        options?: HistoryOptions
    ): Promise<Model & ModelRelations> {
        if (options && options.crud) {
            return super.findById(id, filter, options);
        }

        const maxDate = options && options.maxDate;
        const endDateCondition = {
            endDate: maxDate ? { lt: maxDate } : null
        };
        const result = await this.findHistory(
            Boolean(maxDate),
            {
                ...filter,
                where: {
                    and: [filter && filter.where, { id: id }, endDateCondition]
                }
            },
            options
        );
        if (result[0]) {
            return result[0];
        }
        throw new EntityNotFoundError(this.entityClass, id);
    }

    async count(
        where?: Where<Model>,
        options?: HistoryOptions
    ): Promise<Count> {
        if (options && options.crud) {
            return super.count(where, options);
        }

        const maxDate = options && options.maxDate;
        const endDateCondition = {
            endDate: maxDate ? { lt: maxDate } : null
        };
        const result = await this.findHistory(
            Boolean(maxDate),
            {
                where: {
                    and: [where, endDateCondition]
                }
            },
            options
        );
        return {
            count: result.length
        };
    }

    async exists(id: string, options?: HistoryOptions): Promise<boolean> {
        if (options && options.crud) {
            return super.exists(id, options);
        }

        const maxDate = options && options.maxDate;
        const endDateCondition = {
            endDate: maxDate ? { lt: maxDate } : null
        };
        const result = await this.findHistory(
            Boolean(maxDate),
            {
                where: {
                    and: [{ id: id }, endDateCondition]
                }
            },
            options
        );
        if (result[0]) {
            return true;
        }
        return false;
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

        const entities = await super.find(
            {
                where: where as any
            },
            options
        );

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
                and: [{ id: entity.id }, { endDate: null }]
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
                and: [{ id: id }, { endDate: null }]
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
                and: [{ id: id }, { endDate: null }]
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

        await this.deleteHistory(
            {
                and: [{ id: entity.id }, { endDate: null }]
            },
            options
        );
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
                and: [where, { endDate: null }]
            },
            options
        );
    }

    async deleteById(id: string, options?: HistoryOptions): Promise<void> {
        if (options && options.crud) {
            return super.deleteById(id, options);
        }

        await this.deleteHistory(
            {
                and: [{ id: id }, { endDate: null }]
            },
            options
        );
    }
}
