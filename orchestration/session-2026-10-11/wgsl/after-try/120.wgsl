// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 0 ) @group( 1 ) var nodeUniform0_sampler : sampler;
@binding( 1 ) @group( 1 ) var nodeUniform0 : texture_3d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform7_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform7 : texture_2d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform22_sampler : sampler_comparison;
@binding( 6 ) @group( 1 ) var nodeUniform22 : texture_depth_2d;

struct objectStruct {
	nodeUniform1 : f32,
	nodeUniform2 : f32,
	nodeUniform4 : mat3x3<f32>,
	nodeUniform5 : vec3<f32>,
	nodeUniform6 : f32,
	nodeUniform8 : mat4x4<f32>,
	nodeUniform30 : vec3<f32>,
	nodeUniform31 : vec3<f32>,
	nodeUniform33 : vec3<f32>,
	nodeUniform34 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform10 : vec3<f32>,
	nodeUniform12 : vec3<f32>,
	nodeUniform9 : vec3<f32>,
	nodeUniform15 : vec3<f32>,
	nodeUniform18 : vec3<f32>,
	nodeUniform27 : vec3<f32>,
	nodeUniform28 : f32,
	nodeUniform29 : f32,
	nodeUniform13 : vec3<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform26 : vec3<f32>,
	nodeUniform19 : mat4x4<f32>,
	nodeUniform20 : f32,
	nodeUniform21 : f32,
	nodeUniform25 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform23 : f32,
	nodeUniform24 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : f32;
var<private> nodeVar1 : u32;
var<private> nodeVar2 : u32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : u32;
var<private> nodeVar8 : u32;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : u32;
var<private> nodeVar12 : u32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : u32;
var<private> nodeVar17 : u32;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : u32;
var<private> nodeVar20 : u32;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : f32;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : f32;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : f32;
var<private> nodeVar32 : f32;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : f32;
var<private> nodeVar35 : f32;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar36 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> nodeVar37 : vec3<f32>;
var<private> nodeVar38 : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> NORMAL_nodeVar39 : vec3<f32>;
var<private> NORMAL_nodeVar40 : f32;
var<private> nodeVar41 : f32;
var<private> nodeVar42 : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar43 : f32;
var<private> nodeVar44 : vec2<f32>;
var<private> nodeVar45 : f32;
var<private> nodeVar46 : f32;
var<private> nodeVar47 : f32;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : vec3<f32>;
var<private> nodeVar50 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar51 : f32;
var<private> nodeVar52 : f32;
var<private> nodeVar53 : f32;
var<private> nodeVar54 : vec3<f32>;
var<private> nodeVar55 : vec3<f32>;
var<private> nodeVar56 : vec3<f32>;
var<private> nodeVar57 : vec4<f32>;
var<private> nodeVar58 : vec4<f32>;
var<private> nodeVar59 : vec3<f32>;
var<private> nodeVar60 : vec3<f32>;
var<private> nodeVar61 : f32;
var<private> nodeVar62 : vec3<f32>;
var<private> nodeVar63 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar64 : vec3<f32>;
var<private> nodeVar65 : vec3<f32>;
var<private> nodeVar66 : vec3<f32>;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : f32;
var<private> nodeVar69 : f32;
var<private> nodeVar70 : f32;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : vec3<f32>;
var<private> nodeVar73 : vec3<f32>;
var<private> nodeVar74 : vec3<f32>;
var<private> nodeVar75 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar76 : vec3<f32>;
var<private> nodeVar77 : f32;
var<private> nodeVar78 : f32;
var<private> nodeVar79 : f32;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : vec4<f32>;
var<private> nodeVar86 : vec4<f32>;
var<private> nodeVar87 : vec3<f32>;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar90 : f32;
var<private> nodeVar91 : vec4<f32>;
var<private> nodeVar92 : vec3<f32>;
var<private> nodeVar93 : vec3<f32>;
var<private> nodeVar94 : f32;
var<private> nodeVar95 : f32;
var<private> nodeVar96 : vec2<f32>;
var<private> nodeVar97 : f32;
var<private> nodeVar98 : vec2<f32>;
var<private> nodeVar99 : f32;
var<private> nodeVar100 : vec2<f32>;
var<private> nodeVar101 : f32;
var<private> nodeVar102 : vec2<f32>;
var<private> nodeVar103 : f32;
var<private> nodeVar104 : vec2<f32>;
var<private> nodeVar105 : f32;
var<private> nodeVar106 : f32;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : f32;
var<private> nodeVar114 : f32;
var<private> nodeVar115 : f32;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : vec3<f32>;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : f32;
var<private> nodeVar123 : f32;
var<private> nodeVar124 : f32;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : vec3<f32>;
var<private> nodeVar131 : f32;
var<private> nodeVar132 : f32;
var<private> nodeVar133 : f32;
var<private> nodeVar134 : f32;
var<private> nodeVar135 : f32;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : f32;
var<private> nodeVar144 : f32;
var<private> nodeVar145 : f32;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : f32;
var<private> nodeVar153 : f32;
var<private> nodeVar154 : f32;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : f32;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : f32;
var<private> nodeVar171 : f32;
var<private> nodeVar172 : f32;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : f32;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : f32;
var<private> nodeVar197 : f32;
var<private> nodeVar198 : f32;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : f32;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : f32;
var<private> nodeVar215 : f32;
var<private> nodeVar216 : f32;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : vec3<f32>;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : vec3<f32>;
var<private> nodeVar233 : vec3<f32>;
var<private> nodeVar234 : vec3<f32>;
var<private> nodeVar235 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar236 : vec3<f32>;
var<private> nodeVar237 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar238 : vec3<f32>;
var<private> nodeVar239 : f32;
var<private> nodeVar240 : f32;
var<private> nodeVar241 : f32;
var<private> nodeVar242 : f32;
var<private> nodeVar243 : f32;
var<private> nodeVar244 : f32;
var<private> nodeVar245 : f32;
var<private> nodeVar246 : f32;
var<private> nodeVar247 : f32;
var<private> nodeVar248 : f32;
var<private> nodeVar249 : f32;
var<private> nodeVar250 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar251 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar252 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar253 : vec3<f32>;
var<private> nodeVar254 : f32;
var<private> nodeVar255 : vec4<f32>;

// codes
fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }
fn V_GGX_SmithCorrelated ( alpha : f32, dotNL : f32, dotNV : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = ( alpha * alpha );

	return ( 0.5 / max( ( ( dotNL * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNV * dotNV ) ) ) ) ) + ( dotNV * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNL * dotNL ) ) ) ) ) ), 0.000001 ) );

}


fn D_GGX ( alpha : f32, dotNH : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;

	nodeVar0 = ( alpha * alpha );
	nodeVar1 = ( 1.0 - ( ( dotNH * dotNH ) * ( 1.0 - nodeVar0 ) ) );

	return ( ( nodeVar0 / ( nodeVar1 * nodeVar1 ) ) * 0.3183098861837907 );

}


fn interleavedGradientNoise ( position : vec2<f32> ) -> f32 {

	


	return fract( ( 52.9829189 * fract( dot( position, vec2<f32>( 0.06711056, 0.00583715 ) ) ) ) );

}


fn vogelDiskSample ( sampleIndex : i32, samplesCount : i32, phi : f32 ) -> vec2<f32> {

	var nodeVar0 : f32;

	nodeVar0 = ( ( f32( sampleIndex ) * 2.399963229728653 ) + phi );

	return ( vec2<f32>( cos( nodeVar0 ), sin( nodeVar0 ) ) * vec2<f32>( sqrt( ( ( f32( sampleIndex ) + 0.5 ) / f32( samplesCount ) ) ) ) );

}




@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) v_normalViewGeometry : vec3<f32>,
	@location( 2 ) v_positionViewDirection : vec3<f32>,
	@location( 3 ) v_positionWorld : vec3<f32>,
	@location( 4 ) nodeVarying7 : vec3<f32>,
	@location( 5 ) nodeVarying8 : vec2<f32>,
	@location( 6 ) nodeVarying9 : vec2<f32>,
	@location( 7 ) nodeVarying10 : vec3<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = floor( ( nodeVarying8.y / 0.72 ) );
	nodeVar1 = ( ( u32( ( nodeVar0 + 2.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar2 = ( ( ( nodeVar1 >> ( ( nodeVar1 >> 28u ) + 4u ) ) ^ nodeVar1 ) * 277803737u );
	nodeVar3 = ( ( ( f32( ( ( nodeVar2 >> 22u ) ^ nodeVar2 ) ) * 2.3283064365386963e-10 ) * 0.2 ) + 0.28 );
	nodeVar4 = ( nodeVarying8.y - ( nodeVar0 * 0.72 ) );
	nodeVar5 = step( nodeVar3, nodeVar4 );
	nodeVar6 = ( ( nodeVar0 * 2.0 ) + nodeVar5 );
	nodeVar7 = ( ( u32( ( nodeVar6 + 11.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar8 = ( ( ( nodeVar7 >> ( ( nodeVar7 >> 28u ) + 4u ) ) ^ nodeVar7 ) * 277803737u );
	nodeVar9 = step( 0.5, nodeVarying9.y );
	nodeVar10 = mix( ( ( ( f32( ( ( nodeVar8 >> 22u ) ^ nodeVar8 ) ) * 2.3283064365386963e-10 ) * 0.75 ) + 0.62 ), nodeVarying9.x, nodeVar9 );
	nodeVar11 = ( ( u32( ( nodeVar6 + 5.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar12 = ( ( ( nodeVar11 >> ( ( nodeVar11 >> 28u ) + 4u ) ) ^ nodeVar11 ) * 277803737u );
	nodeVar13 = ( ( nodeVarying8.x / nodeVar10 ) + ( ( tsl_mod_float( nodeVar6, 2.0 ) * 0.5 ) + floor( ( ( f32( ( ( nodeVar12 >> 22u ) ^ nodeVar12 ) ) * 2.3283064365386963e-10 ) * 8.0 ) ) ) );
	nodeVar14 = floor( nodeVar13 );
	nodeVar15 = ( mix( nodeVar14, tsl_mod_float( nodeVar14, max( nodeVarying9.y, 1.0 ) ), nodeVar9 ) + ( nodeVar6 * 57.3 ) );
	nodeVar16 = ( ( u32( ( nodeVar15 + 19.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar17 = ( ( ( nodeVar16 >> ( ( nodeVar16 >> 28u ) + 4u ) ) ^ nodeVar16 ) * 277803737u );
	nodeVar18 = ( ( f32( ( ( nodeVar17 >> 22u ) ^ nodeVar17 ) ) * 2.3283064365386963e-10 ) - 0.5 );
	nodeVar19 = ( ( u32( nodeVar15 ) * 747796405u ) + 2891336453u );
	nodeVar20 = ( ( ( nodeVar19 >> ( ( nodeVar19 >> 28u ) + 4u ) ) ^ nodeVar19 ) * 277803737u );
	nodeVar21 = ( ( ( f32( ( ( nodeVar20 >> 22u ) ^ nodeVar20 ) ) * 2.3283064365386963e-10 ) * 0.62 ) + 0.66 );
	nodeVar22 = textureSample( nodeUniform0, nodeUniform0_sampler, ( vec3<f32>( ( nodeVarying8.x * 6.3 ), ( nodeVarying8.y * 6.3 ), ( nodeVar15 * 0.37 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar23 = smoothstep( 0.4, 0.7, 0.0 );
	nodeVar24 = textureSample( nodeUniform0, nodeUniform0_sampler, ( vec3<f32>( ( nodeVarying8.x * 0.85 ), ( nodeVarying8.y * 0.16 ), 3.3 ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar25 = textureSample( nodeUniform0, nodeUniform0_sampler, ( vec3<f32>( ( nodeVarying8.x * 0.5 ), ( nodeVarying8.y * 0.45 ), 8.2 ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar26 = fract( nodeVar13 );
	nodeVar27 = mix( nodeVar3, ( 0.72 - nodeVar3 ), nodeVar5 );
	nodeVar28 = ( ( nodeVar4 - ( nodeVar5 * nodeVar3 ) ) / nodeVar27 );
	nodeVar29 = textureSample( nodeUniform0, nodeUniform0_sampler, ( vec3<f32>( ( nodeVarying8.x * 7.1 ), ( nodeVarying8.y * 7.1 ), 1.7 ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar30 = ( min( ( min( nodeVar26, ( 1.0 - nodeVar26 ) ) * nodeVar10 ), ( min( nodeVar28, ( 1.0 - nodeVar28 ) ) * nodeVar27 ) ) + ( nodeVar29 * 0.011 ) );
	nodeVar31 = max( fwidth( nodeVarying8.x ), fwidth( nodeVarying8.y ) );
	nodeVar32 = ( ( nodeVar31 * 0.75 ) + 0.0015 );
	nodeVar33 = mix( ( 1.0 - smoothstep( ( 0.024 - nodeVar32 ), ( 0.024 + nodeVar32 ), nodeVar30 ) ), 0.17, smoothstep( 0.1, 0.34, nodeVar31 ) );
	nodeVar34 = smoothstep( 1.7, 0.0, ( ( nodeVarying10.z + ( nodeVar22 * 0.35 ) ) + ( nodeVar25 * 0.4 ) ) );
	nodeVar35 = textureSample( nodeUniform0, nodeUniform0_sampler, ( vec3<f32>( ( nodeVarying8.x * 2.4 ), ( nodeVarying8.y * 2.4 ), 9.1 ) / vec3<f32>( 8.0 ) ) ).x;
	DiffuseColor = vec4<f32>( mix( ( ( nodeVarying7 * vec3<f32>( ( 1.0 + ( nodeVar18 * 0.12 ) ), ( 1.0 - ( nodeVar18 * 0.02 ) ), ( 1.0 - ( nodeVar18 * 0.14 ) ) ) ) * vec3<f32>( max( ( ( ( ( ( ( ( ( ( ( nodeVar21 + ( nodeVar22 * 0.11 ) ) + 0.0 ) + ( nodeVar23 * 0.07 ) ) + ( nodeVar24 * 0.1 ) ) + ( nodeVar25 * 0.12 ) ) + ( smoothstep( 0.32, 0.0, ( min( nodeVarying10.x, nodeVarying10.y ) + ( nodeVar22 * 0.08 ) ) ) * 0.16 ) ) + ( ( smoothstep( 0.08, 0.035, nodeVar30 ) * ( 1.0 - nodeVar33 ) ) * 0.1 ) ) * ( ( smoothstep( 0.0, 0.2, nodeVar30 ) * 0.16 ) + 0.84 ) ) * ( 1.0 - ( nodeVar34 * 0.4 ) ) ) * ( 1.0 - ( nodeVar33 * 0.65 ) ) ), 0.0 ) ) ), ( vec3<f32>( 0.07, 0.09, 0.03 ) * vec3<f32>( nodeVar21 ) ), ( ( ( ( nodeVar34 * smoothstep( 0.0, 0.55, ( nodeVar35 + 0.15 ) ) ) * smoothstep( 1.1, 0.0, nodeVarying10.z ) ) * ( 1.0 - nodeVar33 ) ) * 0.6 ) ), 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform1 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform2;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar36 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( mix( 0.93, 0.5, ( nodeVar34 * 0.75 ) ), 0.0525 ) + max( max( nodeVar36.x, nodeVar36.y ), nodeVar36.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform2 ) ) );
	EmissiveColor = ( object.nodeUniform5 * vec3<f32>( object.nodeUniform6 ) );
	nodeVar37 = dpdx( v_positionView );
	nodeVar38 = - dpdy( v_positionView );
	NORMAL_normalView = normalViewGeometry;
	NORMAL_nodeVar39 = cross( nodeVar38, NORMAL_normalView );
	NORMAL_nodeVar40 = dot( nodeVar37, NORMAL_nodeVar39 );
	nodeVar41 = ( ( ( ( ( smoothstep( 0.0, 0.07, nodeVar30 ) * 0.014 ) + ( smoothstep( 0.0, 0.02, nodeVar30 ) * 0.006 ) ) + 0.0 ) + ( nodeVar23 * -0.004 ) ) * ( 1.0 - smoothstep( 0.05, 0.22, nodeVar31 ) ) );
	nodeVar42 = ( vec3<f32>( sign( NORMAL_nodeVar40 ) ) * ( ( vec3<f32>( dpdx( nodeVar41 ) ) * NORMAL_nodeVar39 ) + ( vec3<f32>( - dpdy( nodeVar41 ) ) * cross( NORMAL_normalView, nodeVar37 ) ) ) );
	normalView = normalize( ( ( vec3<f32>( abs( NORMAL_nodeVar40 ) ) * NORMAL_normalView ) - nodeVar42 ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar43 = dot( normalView, positionViewDirection );
	nodeVar44 = textureSample( nodeUniform7, nodeUniform7_sampler, vec2<f32>( Roughness, clamp( nodeVar43, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar44;
	nodeVar45 = ( dfg.x + dfg.y );
	nodeVar46 = ( 1.0 / nodeVar45 );
	nodeVar47 = nodeVar46;
	nodeVar48 = ( nodeVar47 - 1.0 );
	nodeVar49 = ( SpecularColorBlended * vec3<f32>( nodeVar48 ) );
	nodeVar50 = ( nodeVar49 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar50;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar51 = dot( normalWorld, normalize( render.nodeUniform12 ) );
	nodeVar52 = ( nodeVar51 * 0.5 );
	nodeVar53 = ( nodeVar52 + 0.5 );
	nodeVar54 = mix( render.nodeUniform9, render.nodeUniform10, nodeVar53 );
	nodeVar55 = ( irradiance + nodeVar54 );
	irradiance = nodeVar55;
	nodeVar56 = ( render.nodeUniform13 - render.nodeUniform14 );
	nodeVar57 = vec4<f32>( nodeVar56, 0.0 );
	nodeVar58 = ( render.cameraViewMatrix * nodeVar57 );
	nodeVar59 = normalize( nodeVar58.xyz );
	nodeVar60 = nodeVar59;
	nodeVar61 = dot( normalView, nodeVar60 );
	nodeVar62 = ( vec3<f32>( clamp( nodeVar61, 0.0, 1.0 ) ) * render.nodeUniform15 );
	nodeVar63 = nodeVar62;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar64 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar65 = ( nodeVar63 * nodeVar64 );
	nodeVar66 = ( nodeVar60 + positionViewDirection );
	nodeVar67 = normalize( nodeVar66 );
	nodeVar68 = dot( positionViewDirection, nodeVar67 );
	nodeVar69 = clamp( nodeVar68, 0.0, 1.0 );
	nodeVar70 = exp2( ( ( ( nodeVar69 * -5.55473 ) - 6.98316 ) * nodeVar69 ) );
	nodeVar71 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar70 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar70 ) ) );
	nodeVar72 = ( vec3<f32>( 1.0 ) - nodeVar71 );
	nodeVar73 = nodeVar72;
	nodeVar74 = ( nodeVar65 * nodeVar73 );
	nodeVar75 = ( directDiffuse + nodeVar74 );
	directDiffuse = nodeVar75;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar76 = normalize( ( nodeVar60 + positionViewDirection ) );
	nodeVar77 = clamp( dot( positionViewDirection, nodeVar76 ), 0.0, 1.0 );
	nodeVar78 = exp2( ( ( ( nodeVar77 * -5.55473 ) - 6.98316 ) * nodeVar77 ) );
	nodeVar79 = ( Roughness * Roughness );
	nodeVar80 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar78 ) ) ) + vec3<f32>( ( 1.0 * nodeVar78 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar79, clamp( dot( normalView, nodeVar60 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar79, clamp( dot( normalView, nodeVar76 ), 0.0, 1.0 ) ) ) );
	nodeVar81 = ( nodeVar63 * nodeVar80 );
	nodeVar82 = ( nodeVar81 * multiScatteringCompensation );
	nodeVar83 = ( directSpecular + nodeVar82 );
	directSpecular = nodeVar83;
	nodeVar84 = ( render.nodeUniform16 - render.nodeUniform17 );
	nodeVar85 = vec4<f32>( nodeVar84, 0.0 );
	nodeVar86 = ( render.cameraViewMatrix * nodeVar85 );
	nodeVar87 = normalize( nodeVar86.xyz );
	nodeVar88 = nodeVar87;
	nodeVar89 = dot( normalView, nodeVar88 );
	shadowPositionWorld = v_positionWorld;
	nodeVar91 = ( render.nodeUniform19 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform20 ) ) ), 1.0 ) );
	nodeVar92 = ( nodeVar91.xyz / vec3<f32>( nodeVar91.w ) );
	nodeVar93 = vec3<f32>( nodeVar92.x, ( 1.0 - nodeVar92.y ), ( nodeVar92.z + render.nodeUniform21 ) );

	if ( ( ( ( ( ( nodeVar93.x >= 0.0 ) && ( nodeVar93.x <= 1.0 ) ) && ( nodeVar93.y >= 0.0 ) ) && ( nodeVar93.y <= 1.0 ) ) && ( nodeVar93.z <= 1.0 ) ) ) {

		nodeVar94 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar95 = ( render.nodeUniform23 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform24 ).x );
		nodeVar96 = ( nodeVar93.xy + ( vogelDiskSample( 0, 5, nodeVar94 ) * vec2<f32>( nodeVar95 ) ) );
		nodeVar97 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar96, nodeVar93.z );
		nodeVar98 = ( nodeVar93.xy + ( vogelDiskSample( 1, 5, nodeVar94 ) * vec2<f32>( nodeVar95 ) ) );
		nodeVar99 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar98, nodeVar93.z );
		nodeVar100 = ( nodeVar93.xy + ( vogelDiskSample( 2, 5, nodeVar94 ) * vec2<f32>( nodeVar95 ) ) );
		nodeVar101 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar100, nodeVar93.z );
		nodeVar102 = ( nodeVar93.xy + ( vogelDiskSample( 3, 5, nodeVar94 ) * vec2<f32>( nodeVar95 ) ) );
		nodeVar103 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar102, nodeVar93.z );
		nodeVar104 = ( nodeVar93.xy + ( vogelDiskSample( 4, 5, nodeVar94 ) * vec2<f32>( nodeVar95 ) ) );
		nodeVar105 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar104, nodeVar93.z );
		nodeVar90 = ( ( ( ( ( nodeVar97 + nodeVar99 ) + nodeVar101 ) + nodeVar103 ) + nodeVar105 ) * 0.2 );

	} else {

		nodeVar90 = 1.0;

	}

	nodeVar106 = mix( 1.0, nodeVar90, render.nodeUniform25 );
	nodeVar107 = ( vec3<f32>( clamp( nodeVar89, 0.0, 1.0 ) ) * ( render.nodeUniform18 * vec3<f32>( nodeVar106 ) ) );
	nodeVar108 = nodeVar107;
	nodeVar109 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar110 = ( nodeVar108 * nodeVar109 );
	nodeVar111 = ( nodeVar88 + positionViewDirection );
	nodeVar112 = normalize( nodeVar111 );
	nodeVar113 = dot( positionViewDirection, nodeVar112 );
	nodeVar114 = clamp( nodeVar113, 0.0, 1.0 );
	nodeVar115 = exp2( ( ( ( nodeVar114 * -5.55473 ) - 6.98316 ) * nodeVar114 ) );
	nodeVar116 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar115 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar115 ) ) );
	nodeVar117 = ( vec3<f32>( 1.0 ) - nodeVar116 );
	nodeVar118 = nodeVar117;
	nodeVar119 = ( nodeVar110 * nodeVar118 );
	nodeVar120 = ( directDiffuse + nodeVar119 );
	directDiffuse = nodeVar120;
	nodeVar121 = normalize( ( nodeVar88 + positionViewDirection ) );
	nodeVar122 = clamp( dot( positionViewDirection, nodeVar121 ), 0.0, 1.0 );
	nodeVar123 = exp2( ( ( ( nodeVar122 * -5.55473 ) - 6.98316 ) * nodeVar122 ) );
	nodeVar124 = ( Roughness * Roughness );
	nodeVar125 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar123 ) ) ) + vec3<f32>( ( 1.0 * nodeVar123 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar124, clamp( dot( normalView, nodeVar88 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar124, clamp( dot( normalView, nodeVar121 ), 0.0, 1.0 ) ) ) );
	nodeVar126 = ( nodeVar108 * nodeVar125 );
	nodeVar127 = ( nodeVar126 * multiScatteringCompensation );
	nodeVar128 = ( directSpecular + nodeVar127 );
	directSpecular = nodeVar128;
	nodeVar129 = ( render.nodeUniform26 - v_positionView );
	nodeVar130 = normalize( nodeVar129 );
	nodeVar131 = dot( normalView, nodeVar130 );

	if ( ( render.nodeUniform28 > 0.0 ) ) {

		nodeVar133 = length( nodeVar129 );
		nodeVar134 = ( nodeVar133 / render.nodeUniform28 );
		nodeVar135 = clamp( ( 1.0 - ( ( ( nodeVar134 * nodeVar134 ) * nodeVar134 ) * nodeVar134 ) ), 0.0, 1.0 );
		nodeVar132 = ( ( 1.0 / max( pow( nodeVar133, render.nodeUniform29 ), 0.01 ) ) * ( nodeVar135 * nodeVar135 ) );

	} else {

		nodeVar132 = ( 1.0 / max( pow( length( nodeVar129 ), render.nodeUniform29 ), 0.01 ) );

	}

	nodeVar136 = ( render.nodeUniform27 * vec3<f32>( nodeVar132 ) );
	nodeVar137 = ( vec3<f32>( clamp( nodeVar131, 0.0, 1.0 ) ) * nodeVar136 );
	nodeVar138 = nodeVar137;
	nodeVar139 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar140 = ( nodeVar138 * nodeVar139 );
	nodeVar141 = ( nodeVar130 + positionViewDirection );
	nodeVar142 = normalize( nodeVar141 );
	nodeVar143 = dot( positionViewDirection, nodeVar142 );
	nodeVar144 = clamp( nodeVar143, 0.0, 1.0 );
	nodeVar145 = exp2( ( ( ( nodeVar144 * -5.55473 ) - 6.98316 ) * nodeVar144 ) );
	nodeVar146 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar145 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar145 ) ) );
	nodeVar147 = ( vec3<f32>( 1.0 ) - nodeVar146 );
	nodeVar148 = nodeVar147;
	nodeVar149 = ( nodeVar140 * nodeVar148 );
	nodeVar150 = ( directDiffuse + nodeVar149 );
	directDiffuse = nodeVar150;
	nodeVar151 = normalize( ( nodeVar130 + positionViewDirection ) );
	nodeVar152 = clamp( dot( positionViewDirection, nodeVar151 ), 0.0, 1.0 );
	nodeVar153 = exp2( ( ( ( nodeVar152 * -5.55473 ) - 6.98316 ) * nodeVar152 ) );
	nodeVar154 = ( Roughness * Roughness );
	nodeVar155 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar153 ) ) ) + vec3<f32>( ( 1.0 * nodeVar153 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar154, clamp( dot( normalView, nodeVar130 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar154, clamp( dot( normalView, nodeVar151 ), 0.0, 1.0 ) ) ) );
	nodeVar156 = ( nodeVar138 * nodeVar155 );
	nodeVar157 = ( nodeVar156 * multiScatteringCompensation );
	nodeVar158 = ( directSpecular + nodeVar157 );
	directSpecular = nodeVar158;
	nodeVar159 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar160 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar161 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar162 = ( SpecularF90 * dfg.y );
	nodeVar163 = ( nodeVar161 + vec3<f32>( nodeVar162 ) );
	nodeVar164 = ( nodeVar159 + nodeVar163 );
	nodeVar159 = nodeVar164;
	nodeVar165 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar166 = nodeVar165;
	nodeVar167 = ( nodeVar166 * vec3<f32>( 0.047619 ) );
	nodeVar168 = ( SpecularColor + nodeVar167 );
	nodeVar169 = ( nodeVar163 * nodeVar168 );
	nodeVar170 = ( dfg.x + dfg.y );
	nodeVar171 = ( 1.0 - nodeVar170 );
	nodeVar172 = nodeVar171;
	nodeVar173 = ( vec3<f32>( nodeVar172 ) * nodeVar168 );
	nodeVar174 = ( vec3<f32>( 1.0 ) - nodeVar173 );
	nodeVar175 = nodeVar174;
	nodeVar176 = ( nodeVar169 / nodeVar175 );
	nodeVar177 = ( nodeVar176 * vec3<f32>( nodeVar172 ) );
	nodeVar178 = ( nodeVar160 + nodeVar177 );
	nodeVar160 = nodeVar178;
	nodeVar179 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar180 = ( irradiance * nodeVar179 );
	nodeVar181 = ( nodeVar159 + nodeVar160 );
	nodeVar182 = ( vec3<f32>( 1.0 ) - nodeVar181 );
	nodeVar183 = nodeVar182;
	nodeVar184 = ( nodeVar180 * nodeVar183 );
	nodeVar185 = nodeVar184;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar186 = ( indirectDiffuse + nodeVar185 );
	indirectDiffuse = nodeVar186;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar187 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar188 = ( SpecularF90 * dfg.y );
	nodeVar189 = ( nodeVar187 + vec3<f32>( nodeVar188 ) );
	nodeVar190 = ( singleScatteringDielectric + nodeVar189 );
	singleScatteringDielectric = nodeVar190;
	nodeVar191 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar192 = nodeVar191;
	nodeVar193 = ( nodeVar192 * vec3<f32>( 0.047619 ) );
	nodeVar194 = ( SpecularColor + nodeVar193 );
	nodeVar195 = ( nodeVar189 * nodeVar194 );
	nodeVar196 = ( dfg.x + dfg.y );
	nodeVar197 = ( 1.0 - nodeVar196 );
	nodeVar198 = nodeVar197;
	nodeVar199 = ( vec3<f32>( nodeVar198 ) * nodeVar194 );
	nodeVar200 = ( vec3<f32>( 1.0 ) - nodeVar199 );
	nodeVar201 = nodeVar200;
	nodeVar202 = ( nodeVar195 / nodeVar201 );
	nodeVar203 = ( nodeVar202 * vec3<f32>( nodeVar198 ) );
	nodeVar204 = ( multiScatteringDielectric + nodeVar203 );
	multiScatteringDielectric = nodeVar204;
	nodeVar205 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar206 = ( SpecularF90 * dfg.y );
	nodeVar207 = ( nodeVar205 + vec3<f32>( nodeVar206 ) );
	nodeVar208 = ( singleScatteringMetallic + nodeVar207 );
	singleScatteringMetallic = nodeVar208;
	nodeVar209 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar210 = nodeVar209;
	nodeVar211 = ( nodeVar210 * vec3<f32>( 0.047619 ) );
	nodeVar212 = ( DiffuseColor.xyz + nodeVar211 );
	nodeVar213 = ( nodeVar207 * nodeVar212 );
	nodeVar214 = ( dfg.x + dfg.y );
	nodeVar215 = ( 1.0 - nodeVar214 );
	nodeVar216 = nodeVar215;
	nodeVar217 = ( vec3<f32>( nodeVar216 ) * nodeVar212 );
	nodeVar218 = ( vec3<f32>( 1.0 ) - nodeVar217 );
	nodeVar219 = nodeVar218;
	nodeVar220 = ( nodeVar213 / nodeVar219 );
	nodeVar221 = ( nodeVar220 * vec3<f32>( nodeVar216 ) );
	nodeVar222 = ( multiScatteringMetallic + nodeVar221 );
	multiScatteringMetallic = nodeVar222;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar223 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar224 = ( radiance * nodeVar223 );
	nodeVar225 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar226 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar227 = ( nodeVar225 * nodeVar226 );
	nodeVar228 = ( nodeVar224 + nodeVar227 );
	nodeVar229 = nodeVar228;
	nodeVar230 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar231 = ( vec3<f32>( 1.0 ) - nodeVar230 );
	nodeVar232 = nodeVar231;
	nodeVar233 = ( DiffuseContribution * nodeVar232 );
	nodeVar234 = ( nodeVar233 * nodeVar226 );
	nodeVar235 = nodeVar234;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar236 = ( indirectSpecular + nodeVar229 );
	indirectSpecular = nodeVar236;
	nodeVar237 = ( indirectDiffuse + nodeVar235 );
	indirectDiffuse = nodeVar237;
	ambientOcclusion = 1.0;
	nodeVar238 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar238;
	nodeVar239 = dot( normalView, positionViewDirection );
	nodeVar240 = ( clamp( nodeVar239, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar241 = ( Roughness * -16.0 );
	nodeVar242 = ( 1.0 - nodeVar241 );
	nodeVar243 = nodeVar242;
	nodeVar244 = ( - nodeVar243 );
	nodeVar245 = exp2( nodeVar244 );
	nodeVar246 = pow( nodeVar240, nodeVar245 );
	nodeVar247 = ( 1.0 - nodeVar246 );
	nodeVar248 = nodeVar247;
	nodeVar249 = ( ambientOcclusion - nodeVar248 );
	nodeVar250 = ( indirectSpecular * vec3<f32>( clamp( nodeVar249, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar250;
	nodeVar251 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar251;
	nodeVar252 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar252;
	nodeVar253 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar253;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar254 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar255 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform30, object.nodeUniform31, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform33 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform34 * object.nodeUniform34 ) * nodeVar254 ) * nodeVar254 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar255;

	// result

	output.color = nodeVar255;

	return output;

}
