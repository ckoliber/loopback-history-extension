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

export class HistoryCrudRepository<
    Model extends HistoryEntity,
    ID,
    ModelRelations extends HistoryEntityRelations
> extends DefaultCrudRepository<Model, ID, ModelRelations> {
    constructor(
        entityClass: typeof HistoryEntity & {
            prototype: Model;
        },
        dataSource: juggler.DataSource
    ) {
        super(entityClass, dataSource);
    }

    async create(entity: DataObject<Model>, options?: Options): Promise<Model> {
        /** uid, id => uuidv4 */
        /** beginDate => now */
        /** endDate => null */
        delete entity.uid;
        entity.beginDate = new Date();
        delete entity.endDate;
        delete entity.id;

        return super.create(entity, options);
    }
    async createAll(
        entities: DataObject<Model>[],
        options?: Options
    ): Promise<Model[]> {
        const date = new Date();

        entities = entities.map(entity => {
            /** uid, id => uuidv4 */
            /** beginDate => now */
            /** endDate => null */
            delete entity.uid;
            entity.beginDate = date;
            delete entity.endDate;
            delete entity.id;

            return entity;
        });

        return super.createAll(entities, options);
    }

    async find(
        filter?: Filter<Model>,
        options?: Options
    ): Promise<(Model & ModelRelations)[]> {
        return super.find(filter, options);
    }
    async findOne(
        filter?: Filter<Model>,
        options?: Options
    ): Promise<(Model & ModelRelations) | null> {
        return super.findOne(filter, options);
    }
    async findById(
        id: ID,
        filter?: Filter<Model>,
        options?: Options
    ): Promise<Model & ModelRelations> {
        return super.findById(id, filter, options);
    }

    async update(entity: Model, options?: Options): Promise<void> {
        return super.update(entity, options);
    }
    async updateAll(
        data: DataObject<Model>,
        where?: Where<Model>,
        options?: Options
    ): Promise<Count> {
        return super.updateAll(data, where, options);
    }
    async updateById(
        id: ID,
        data: DataObject<Model>,
        options?: Options
    ): Promise<void> {
        return super.updateById(id, data, options);
    }
    async replaceById(
        id: ID,
        data: DataObject<Model>,
        options?: Options
    ): Promise<void> {
        return super.replaceById(id, data, options);
    }

    async delete(entity: Model, options?: Options): Promise<void> {
        return super.delete(entity, options);
    }
    async deleteAll(where?: Where<Model>, options?: Options): Promise<Count> {
        return super.deleteAll(where, options);
    }
    async deleteById(id: ID, options?: Options): Promise<void> {
        return super.deleteById(id, options);
    }

    async count(where?: Where<Model>, options?: Options): Promise<Count> {
        return super.count(where, options);
    }
    async exists(id: ID, options?: Options): Promise<boolean> {
        return super.exists(id, options);
    }
}
