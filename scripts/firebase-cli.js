// Sesión Firebase del proyecto, fuera de Git; evita la carpeta global de configuración.
import {spawnSync} from 'node:child_process';
import {mkdirSync,chmodSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
const config=resolve(root,'.tools/firebase-config');
mkdirSync(config,{recursive:true,mode:0o700});chmodSync(config,0o700);
const args=process.argv.slice(2);
if(args.includes('--project')&&args[args.indexOf('--project')+1]!=='arenales-pegball')throw new Error('Sólo se permite el proyecto arenales-pegball');
if(args[0]==='deploy'&&!args.includes('--project'))throw new Error('El despliegue requiere --project arenales-pegball');
const result=spawnSync('firebase',args,{cwd:root,env:{...process.env,XDG_CONFIG_HOME:config},stdio:'inherit'});
if(result.error)throw result.error;
process.exitCode=result.status??1;
