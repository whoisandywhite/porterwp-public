<?php
/**
 * Sample block rendering.
 *
 * @package Baseline
 */

namespace BaselineBlockSampleBlock;

defined( 'ABSPATH' ) || exit;

/**
 * Return the shared PorterWP helper for this block.
 */
function helpers(): object {
	static $helper = null;

	if ( null === $helper ) {
		$helper = new class() {
			use \Porter_Blocks_Trait;
		};
		$helper->dir = __DIR__;
	}

	return $helper;
}

/**
 * Render the block template.
 *
 * @param array          $block      ACF block attributes and settings.
 * @param string         $content    Saved inner block content.
 * @param bool           $is_preview Whether ACF is rendering an editor preview.
 * @param int|string     $post_id    Current post ID or context identifier.
 * @param \WP_Block|null $wp_block   Current WordPress block instance.
 * @param array          $context    Inherited block context.
 */
function pre_render( $block, $content, $is_preview, $post_id, $wp_block, $context ): void {
	$extra_attributes = array();

	if ( ! empty( $block['anchor'] ) ) {
		$extra_attributes['id'] = $block['anchor'];
	}

	$args = array(
		'is_preview'         => (bool) $is_preview,
		'wrapper_attributes' => $is_preview ? '' : \get_block_wrapper_attributes( $extra_attributes ),
	);

	\get_template_part( helpers()->path() . '/template', null, $args );
}
