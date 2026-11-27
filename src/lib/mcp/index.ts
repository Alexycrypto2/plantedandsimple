import { auth, defineMcp } from '@lovable.dev/mcp-js';
import list_recipes from './tools/list-recipes';
import list_posts from './tools/list-posts';
import get_post from './tools/get-post';
import create_draft from './tools/create-draft';
import update_post from './tools/update-post';
import rollback_post from './tools/rollback-post';
import set_post_status from './tools/set-post-status';
import list_post_versions from './tools/list-post-versions';
import generate_post from './tools/generate-post';
import get_seo_score from './tools/get-seo-score';
import delete_post from './tools/delete-post';
import get_recipe from './tools/get-recipe';
import get_recipe_seo_score from './tools/get-recipe-seo-score';
import update_recipe from './tools/update-recipe';
import list_recipe_versions from './tools/list-recipe-versions';
import rollback_recipe from './tools/rollback-recipe';
import set_recipe_status from './tools/set-recipe-status';
import delete_recipe from './tools/delete-recipe';
import analytics from './tools/get-analytics-summary';
import prices from './tools/get-products-and-prices';

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? 'abzvbcbslfpdhwnqycng';
export default defineMcp({
  name: 'planted-protein-pages', title: 'Planted Protein Pages', version: '1.0.0',
  auth: auth.oauth.issuer({ issuer: `https://${projectRef}.supabase.co/auth/v1`, acceptedAudiences: 'authenticated' }),
  instructions: 'Owner-only content editing, publishing, rollback, SEO checks, site-recorded analytics and current prices. Every edit uses the signed-in owner permissions. Long-running site AI generation stays in Admin AI Studio; assistant-written content can be saved with create_draft. Prices use minor currency units. Do not present site purchase-record counts as revenue.',
  tools: [list_recipes, list_posts, get_post, create_draft, update_post, rollback_post, set_post_status, list_post_versions, generate_post, get_seo_score, delete_post, get_recipe, get_recipe_seo_score, update_recipe, list_recipe_versions, rollback_recipe, set_recipe_status, delete_recipe, analytics, prices],
});
