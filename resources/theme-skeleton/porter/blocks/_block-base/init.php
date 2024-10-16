<?php
/**
 * Porter Block Init functions
 *
 * @package Porter
 **/
namespace porterBlockDummyNamespace;

function helpers()
{
	$helpers = new class { use \Porter_Blocks_Trait; };
	$helpers->dir = __DIR__;
	return $helpers;
}

/**
 * 
 * Block Pre-render function
 *
 **/
function pre_render( $block, $content, $is_preview, $post_id, $wp_block, $context)
{
	// Set block args
	$attrs = [];
	$args = [
		'anchor' => helpers()->anchor( $block ),
	];
	$args['class'] = $is_preview ? helpers()->build_block_class_attrs($attrs) : get_block_wrapper_attributes( $attrs );
	
	// Render the template
	echo \get_template_part( helpers()->path().'/template', '', $args);
}

/**
 * 
 * Register JS Scripts
 * @ref https://developer.wordpress.org/reference/hooks/enqueue_block_assets/
 *
 **/
function register_block_script()
{	
	$name = helpers()->meta('name', true);
	wp_register_script( 
		"$name-block-js", 
		get_theme_file_uri( str_replace( get_template_directory(), '', helpers()->dir ) . '/js/block.js' ),
		[], 
		wp_get_theme()->get('Version'), 
		true 
	);
}
// add_action( 'enqueue_block_assets', __NAMESPACE__.'\\register_block_script');
