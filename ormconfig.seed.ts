import { DataSource } from 'typeorm';
import DataSourceConfigs from './ormconfig';

export default new DataSource(DataSourceConfigs.seedOptions);
