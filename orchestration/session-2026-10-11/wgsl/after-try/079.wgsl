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
@binding( 5 ) @group( 1 ) var nodeUniform21_sampler : sampler_comparison;
@binding( 6 ) @group( 1 ) var nodeUniform21 : texture_depth_2d;

struct objectStruct {
	nodeUniform1 : mat4x4<f32>,
	nodeUniform2 : f32,
	nodeUniform3 : f32,
	nodeUniform5 : mat3x3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform30 : vec3<f32>,
	nodeUniform32 : vec3<f32>,
	nodeUniform33 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	nodeUniform6 : f32,
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform9 : vec3<f32>,
	nodeUniform11 : vec3<f32>,
	nodeUniform8 : vec3<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform26 : vec3<f32>,
	nodeUniform27 : f32,
	nodeUniform28 : f32,
	nodeUniform12 : vec3<f32>,
	nodeUniform13 : vec3<f32>,
	nodeUniform15 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform25 : vec3<f32>,
	nodeUniform18 : mat4x4<f32>,
	nodeUniform19 : f32,
	nodeUniform20 : f32,
	nodeUniform24 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform22 : f32,
	nodeUniform23 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : vec2<f32>;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : u32;
var<private> nodeVar8 : u32;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : u32;
var<private> nodeVar11 : u32;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : f32;
var<private> nodeVar17 : f32;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : f32;
var<private> nodeVar20 : f32;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : u32;
var<private> nodeVar24 : u32;
var<private> nodeVar25 : u32;
var<private> nodeVar26 : u32;
var<private> nodeVar27 : f32;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : f32;
var<private> nodeVar32 : f32;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : vec3<f32>;
var<private> nodeVar35 : f32;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : u32;
var<private> nodeVar39 : u32;
var<private> nodeVar40 : u32;
var<private> nodeVar41 : u32;
var<private> nodeVar42 : f32;
var<private> nodeVar43 : f32;
var<private> nodeVar44 : f32;
var<private> nodeVar45 : f32;
var<private> nodeVar46 : vec3<f32>;
var<private> nodeVar47 : vec3<f32>;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : vec3<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar50 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar51 : vec3<f32>;
var<private> nodeVar52 : f32;
var<private> nodeVar53 : vec3<f32>;
var<private> nodeVar54 : f32;
var<private> nodeVar55 : vec3<f32>;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : vec3<f32>;
var<private> nodeVar58 : f32;
var<private> nodeVar59 : vec3<f32>;
var<private> nodeVar60 : f32;
var<private> nodeVar61 : vec3<f32>;
var<private> nodeVar62 : f32;
var<private> nodeVar63 : vec3<f32>;
var<private> nodeVar64 : f32;
var<private> nodeVar65 : vec3<f32>;
var<private> nodeVar66 : f32;
var<private> Output : vec4<f32>;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> NORMAL_nodeVar69 : vec3<f32>;
var<private> NORMAL_nodeVar70 : f32;
var<private> nodeVar71 : f32;
var<private> nodeVar72 : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar73 : f32;
var<private> nodeVar74 : vec2<f32>;
var<private> nodeVar75 : f32;
var<private> nodeVar76 : f32;
var<private> nodeVar77 : f32;
var<private> nodeVar78 : f32;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar81 : f32;
var<private> nodeVar82 : f32;
var<private> nodeVar83 : f32;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : vec3<f32>;
var<private> nodeVar86 : vec3<f32>;
var<private> nodeVar87 : vec4<f32>;
var<private> nodeVar88 : vec4<f32>;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : f32;
var<private> nodeVar92 : vec3<f32>;
var<private> nodeVar93 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : f32;
var<private> nodeVar99 : f32;
var<private> nodeVar100 : f32;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : vec3<f32>;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : f32;
var<private> nodeVar108 : f32;
var<private> nodeVar109 : f32;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec4<f32>;
var<private> nodeVar116 : vec4<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar120 : f32;
var<private> nodeVar121 : vec4<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : f32;
var<private> nodeVar125 : f32;
var<private> nodeVar126 : vec2<f32>;
var<private> nodeVar127 : f32;
var<private> nodeVar128 : vec2<f32>;
var<private> nodeVar129 : f32;
var<private> nodeVar130 : vec2<f32>;
var<private> nodeVar131 : f32;
var<private> nodeVar132 : vec2<f32>;
var<private> nodeVar133 : f32;
var<private> nodeVar134 : vec2<f32>;
var<private> nodeVar135 : f32;
var<private> nodeVar136 : f32;
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
var<private> nodeVar161 : f32;
var<private> nodeVar162 : f32;
var<private> nodeVar163 : f32;
var<private> nodeVar164 : f32;
var<private> nodeVar165 : f32;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : f32;
var<private> nodeVar174 : f32;
var<private> nodeVar175 : f32;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : f32;
var<private> nodeVar183 : f32;
var<private> nodeVar184 : f32;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : f32;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : f32;
var<private> nodeVar201 : f32;
var<private> nodeVar202 : f32;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : f32;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : f32;
var<private> nodeVar227 : f32;
var<private> nodeVar228 : f32;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : vec3<f32>;
var<private> nodeVar233 : vec3<f32>;
var<private> nodeVar234 : vec3<f32>;
var<private> nodeVar235 : vec3<f32>;
var<private> nodeVar236 : f32;
var<private> nodeVar237 : vec3<f32>;
var<private> nodeVar238 : vec3<f32>;
var<private> nodeVar239 : vec3<f32>;
var<private> nodeVar240 : vec3<f32>;
var<private> nodeVar241 : vec3<f32>;
var<private> nodeVar242 : vec3<f32>;
var<private> nodeVar243 : vec3<f32>;
var<private> nodeVar244 : f32;
var<private> nodeVar245 : f32;
var<private> nodeVar246 : f32;
var<private> nodeVar247 : vec3<f32>;
var<private> nodeVar248 : vec3<f32>;
var<private> nodeVar249 : vec3<f32>;
var<private> nodeVar250 : vec3<f32>;
var<private> nodeVar251 : vec3<f32>;
var<private> nodeVar252 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar253 : vec3<f32>;
var<private> nodeVar254 : vec3<f32>;
var<private> nodeVar255 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar256 : vec3<f32>;
var<private> nodeVar257 : vec3<f32>;
var<private> nodeVar258 : vec3<f32>;
var<private> nodeVar259 : vec3<f32>;
var<private> nodeVar260 : vec3<f32>;
var<private> nodeVar261 : vec3<f32>;
var<private> nodeVar262 : vec3<f32>;
var<private> nodeVar263 : vec3<f32>;
var<private> nodeVar264 : vec3<f32>;
var<private> nodeVar265 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar266 : vec3<f32>;
var<private> nodeVar267 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar268 : vec3<f32>;
var<private> nodeVar269 : f32;
var<private> nodeVar270 : f32;
var<private> nodeVar271 : f32;
var<private> nodeVar272 : f32;
var<private> nodeVar273 : f32;
var<private> nodeVar274 : f32;
var<private> nodeVar275 : f32;
var<private> nodeVar276 : f32;
var<private> nodeVar277 : f32;
var<private> nodeVar278 : f32;
var<private> nodeVar279 : f32;
var<private> nodeVar280 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar281 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar282 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar283 : vec3<f32>;
var<private> nodeVar284 : f32;
var<private> nodeVar285 : vec4<f32>;

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
	@location( 1 ) v_positionWorld : vec3<f32>,
	@location( 2 ) v_normalViewGeometry : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = vec2<f32>( ( v_positionWorld.x - 122.0 ), ( v_positionWorld.z - 86.0 ) );
	nodeVar1 = length( nodeVar0 );
	nodeVar2 = ( nodeVar1 / 1.18 );
	nodeVar3 = floor( nodeVar2 );
	nodeVar4 = ( atan2( nodeVar0.y, nodeVar0.x ) / 6.283185307179586 );
	nodeVar5 = ( ( nodeVar3 + 0.5 ) * 1.18 );
	nodeVar6 = max( round( ( nodeVar5 * 3.9269908169872414 ) ), 6.0 );
	nodeVar7 = ( ( u32( ( nodeVar3 * 3.17 ) ) * 747796405u ) + 2891336453u );
	nodeVar8 = ( ( ( nodeVar7 >> ( ( nodeVar7 >> 28u ) + 4u ) ) ^ nodeVar7 ) * 277803737u );
	nodeVar9 = ( ( nodeVar4 * nodeVar6 ) + ( f32( ( ( nodeVar8 >> 22u ) ^ nodeVar8 ) ) * 2.3283064365386963e-10 ) );
	nodeVar10 = ( ( u32( ( ( nodeVar3 * 53.1 ) + tsl_mod_float( floor( nodeVar9 ), nodeVar6 ) ) ) * 747796405u ) + 2891336453u );
	nodeVar11 = ( ( ( nodeVar10 >> ( ( nodeVar10 >> 28u ) + 4u ) ) ^ nodeVar10 ) * 277803737u );
	nodeVar12 = ( f32( ( ( nodeVar11 >> 22u ) ^ nodeVar11 ) ) * 2.3283064365386963e-10 );
	nodeVar13 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( v_positionWorld * vec3<f32>( 2.4 ) ) + vec3<f32>( nodeVar12 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar14 = length( vec2<f32>( ( v_positionWorld.x - 134.0 ), ( v_positionWorld.z - 86.0 ) ) );
	nodeVar15 = length( vec2<f32>( ( v_positionWorld.x - 122.0 ), ( v_positionWorld.z - 98.0 ) ) );
	nodeVar16 = length( vec2<f32>( ( v_positionWorld.x - 110.0 ), ( v_positionWorld.z - 86.0 ) ) );
	nodeVar17 = length( vec2<f32>( ( v_positionWorld.x - 122.0 ), ( v_positionWorld.z - 74.0 ) ) );
	nodeVar18 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( v_positionWorld * vec3<f32>( 0.33 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar19 = ( max( max( ( smoothstep( 12.8, 16.0, nodeVar1 ) * 0.85 ), ( max( max( max( max( 0.0, ( 1.0 - smoothstep( 0.9, 2.4, nodeVar14 ) ) ), ( 1.0 - smoothstep( 0.9, 2.4, nodeVar15 ) ) ), ( 1.0 - smoothstep( 0.9, 2.4, nodeVar16 ) ) ), ( 1.0 - smoothstep( 0.9, 2.4, nodeVar17 ) ) ) * 0.7 ) ), ( ( 1.0 - smoothstep( 1.6, 3.0, nodeVar1 ) ) * 0.5 ) ) * mix( 0.7, 1.25, ( ( nodeVar18 * 0.5 ) + 0.5 ) ) );
	nodeVar20 = ( smoothstep( 0.0, 0.5, ( ( nodeVar13 + ( nodeVar19 * 0.9 ) ) - 0.15 ) ) * nodeVar19 );
	nodeVar21 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( v_positionWorld * vec3<f32>( 0.16 ) ) + vec3<f32>( 2.2, 0.7, 6.1 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar22 = ( ( ( ( ( ( 1.0 * ( 1.0 - ( ( 1.0 - smoothstep( 0.7, 1.9, nodeVar14 ) ) * 0.42 ) ) ) * ( 1.0 - ( ( 1.0 - smoothstep( 0.7, 1.9, nodeVar15 ) ) * 0.42 ) ) ) * ( 1.0 - ( ( 1.0 - smoothstep( 0.7, 1.9, nodeVar16 ) ) * 0.42 ) ) ) * ( 1.0 - ( ( 1.0 - smoothstep( 0.7, 1.9, nodeVar17 ) ) * 0.42 ) ) ) * ( 1.0 - ( smoothstep( 14.6, 16.1, nodeVar1 ) * 0.48 ) ) ) * ( 1.0 - ( smoothstep( 0.34, 0.7, nodeVar21 ) * 0.4 ) ) );
	nodeVar23 = ( ( u32( ( nodeVar12 + 17.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar24 = ( ( ( nodeVar23 >> ( ( nodeVar23 >> 28u ) + 4u ) ) ^ nodeVar23 ) * 277803737u );
	nodeVar25 = ( ( u32( nodeVar12 ) * 747796405u ) + 2891336453u );
	nodeVar26 = ( ( ( nodeVar25 >> ( ( nodeVar25 >> 28u ) + 4u ) ) ^ nodeVar25 ) * 277803737u );
	nodeVar27 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( v_positionWorld * vec3<f32>( 0.85 ) ) + vec3<f32>( ( nodeVar12 * 1.7 ) ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar28 = ( ( nodeVar27 * 0.5 ) + 0.5 );
	nodeVar29 = fract( nodeVar2 );
	nodeVar30 = fract( nodeVar9 );
	nodeVar31 = min( ( min( nodeVar29, ( 1.0 - nodeVar29 ) ) * 1.18 ), ( min( nodeVar30, ( 1.0 - nodeVar30 ) ) * ( ( nodeVar5 * 6.283185307179586 ) / nodeVar6 ) ) );
	nodeVar32 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( v_positionWorld * vec3<f32>( 9.5 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar33 = ( ( nodeVar31 + ( nodeVar32 * 0.014 ) ) + 0.0 );
	nodeVar34 = ( ( v_positionWorld * vec3<f32>( 2.6 ) ) + vec3<f32>( ( nodeVar12 * 3.1 ) ) );
	nodeVar35 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( nodeVar34 * vec3<f32>( 2.9 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar36 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( nodeVar34 + vec3<f32>( ( nodeVar35 * 0.4 ) ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar37 = abs( nodeVar36 );
	nodeVar38 = ( ( u32( ( nodeVar12 + 3.7 ) ) * 747796405u ) + 2891336453u );
	nodeVar39 = ( ( ( nodeVar38 >> ( ( nodeVar38 >> 28u ) + 4u ) ) ^ nodeVar38 ) * 277803737u );
	nodeVar40 = ( ( u32( ( nodeVar12 + 9.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar41 = ( ( ( nodeVar40 >> ( ( nodeVar40 >> 28u ) + 4u ) ) ^ nodeVar40 ) * 277803737u );
	nodeVar42 = ( 0.02 + ( ( f32( ( ( nodeVar41 >> 22u ) ^ nodeVar41 ) ) * 2.3283064365386963e-10 ) * 0.012 ) );
	nodeVar43 = ( fwidth( nodeVar31 ) + 0.0015 );
	nodeVar44 = smoothstep( ( nodeVar42 - ( nodeVar43 * 0.9 ) ), ( nodeVar42 + ( nodeVar43 * 0.9 ) ), nodeVar33 );
	nodeVar45 = max( ( ( ( 1.0 - smoothstep( 0.016, ( ( ( fwidth( nodeVar37 ) + 0.002 ) * 1.6 ) + 0.016 ), nodeVar37 ) ) * step( 0.725, ( f32( ( ( nodeVar39 >> 22u ) ^ nodeVar39 ) ) * 2.3283064365386963e-10 ) ) ) * nodeVar44 ), ( ( ( ( 1.0 - smoothstep( 0.012, ( 0.012 + ( ( fwidth( 1.0 ) + 0.0015 ) * 1.6 ) ), 1.0 ) ) * 0.55 ) * 0.0 ) * nodeVar44 ) );
	nodeVar46 = ( ( ( ( ( ( ( ( vec3<f32>( 0.215, 0.205, 0.192 ) * mix( vec3<f32>( 0.83, 0.92, 1.05 ), vec3<f32>( 1.07, 0.97, 0.8 ), ( f32( ( ( nodeVar24 >> 22u ) ^ nodeVar24 ) ) * 2.3283064365386963e-10 ) ) ) * vec3<f32>( ( 0.5 + ( ( f32( ( ( nodeVar26 >> 22u ) ^ nodeVar26 ) ) * 2.3283064365386963e-10 ) * 0.85 ) ) ) ) * vec3<f32>( mix( 0.74, 1.14, nodeVar28 ) ) ) * vec3<f32>( ( 1.0 + ( 0.0 * 0.15 ) ) ) ) * vec3<f32>( ( 1.0 - ( 0.0 * 0.3 ) ) ) ) * vec3<f32>( mix( 0.68, 1.0, smoothstep( 0.0, 0.17, nodeVar33 ) ) ) ) * vec3<f32>( ( 1.0 + ( ( smoothstep( 0.02, 0.05, nodeVar33 ) * ( 1.0 - smoothstep( 0.05, 0.11, nodeVar33 ) ) ) * 0.14 ) ) ) ) * vec3<f32>( ( 1.0 - ( nodeVar45 * 0.78 ) ) ) );
	nodeVar47 = mix( ( mix( vec3<f32>( 0.045, 0.041, 0.038 ), vec3<f32>( 0.07, 0.092, 0.04 ), ( nodeVar20 * 0.9 ) ) * vec3<f32>( nodeVar22 ) ), ( ( mix( nodeVar46, ( nodeVar46 * vec3<f32>( 0.62, 0.78, 0.5 ) ), ( nodeVar20 * 0.7 ) ) * vec3<f32>( ( 1.0 - ( nodeVar19 * 0.38 ) ) ) ) * vec3<f32>( nodeVar22 ) ), nodeVar44 );
	nodeVar48 = ( ( fwidth( nodeVar1 ) * 1.2 ) + 0.01 );
	nodeVar49 = mix( nodeVar47, ( nodeVar47 * vec3<f32>( 0.55 ) ), max( ( 1.0 - smoothstep( 0.07, ( 0.07 + nodeVar48 ), abs( ( nodeVar1 - 4.4 ) ) ) ), ( step( 0.84, fract( ( nodeVar4 * 36.0 ) ) ) * ( 1.0 - smoothstep( 0.16, ( nodeVar48 + 0.16 ), abs( ( nodeVar1 - 3.5 ) ) ) ) ) ) );
	DiffuseColor = vec4<f32>( nodeVar49, 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform2 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform3;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar50 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( mix( 1.0, ( ( 0.93 - ( nodeVar28 * 0.1 ) ) + ( nodeVar20 * 0.07 ) ), nodeVar44 ), 0.0525 ) + max( max( nodeVar50.x, nodeVar50.y ), nodeVar50.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform3 ) ) );
	nodeVar51 = ( vec3<f32>( 115.88471875080587, 12.15, 71.23640507046963 ) - v_positionWorld );
	nodeVar52 = ( length( nodeVar51 ) / 4.4 );
	nodeVar53 = ( vec3<f32>( 128.11528124919414, 12.15, 71.23640507046964 ) - v_positionWorld );
	nodeVar54 = ( length( nodeVar53 ) / 4.4 );
	nodeVar55 = ( vec3<f32>( 136.76359492953037, 12.15, 79.88471875080587 ) - v_positionWorld );
	nodeVar56 = ( length( nodeVar55 ) / 4.4 );
	nodeVar57 = ( vec3<f32>( 136.76359492953037, 12.15, 92.11528124919414 ) - v_positionWorld );
	nodeVar58 = ( length( nodeVar57 ) / 4.4 );
	nodeVar59 = ( vec3<f32>( 128.11528124919414, 12.15, 100.76359492953037 ) - v_positionWorld );
	nodeVar60 = ( length( nodeVar59 ) / 4.4 );
	nodeVar61 = ( vec3<f32>( 115.88471875080586, 12.15, 100.76359492953037 ) - v_positionWorld );
	nodeVar62 = ( length( nodeVar61 ) / 4.4 );
	nodeVar63 = ( vec3<f32>( 107.23640507046963, 12.15, 92.11528124919413 ) - v_positionWorld );
	nodeVar64 = ( length( nodeVar63 ) / 4.4 );
	nodeVar65 = ( vec3<f32>( 107.23640507046963, 12.15, 79.88471875080586 ) - v_positionWorld );
	nodeVar66 = ( length( nodeVar65 ) / 4.4 );
	EmissiveColor = ( nodeVar49 * ( ( vec3<f32>( 1.0, 0.52, 0.2 ) * ( ( ( ( ( ( ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar52 * nodeVar52 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar51 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 0.0 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 0.0 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 0.0 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar54 * nodeVar54 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar53 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 2.399 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 4.0783 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 7.4369000000000005 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar56 * nodeVar56 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar55 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 4.798 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 8.1566 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 14.873800000000001 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar58 * nodeVar58 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar57 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 7.197 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 12.2349 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 22.3107 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar60 * nodeVar60 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar59 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 9.596 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 16.3132 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 29.747600000000002 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar62 * nodeVar62 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar61 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 11.995000000000001 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 20.3915 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 37.18450000000001 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar64 * nodeVar64 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar63 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 14.394 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 24.4698 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 44.6214 ) ) * 0.03 ) ) ) ) ) + vec3<f32>( ( ( ( 1.0 / pow( ( 1.0 + ( nodeVar66 * nodeVar66 ) ), 2.0 ) ) * ( ( max( dot( vec3<f32>( 0.0, 1.0, 0.0 ), normalize( nodeVar65 ) ), 0.0 ) * 0.7 ) + 0.3 ) ) * ( ( ( 0.84 + ( sin( ( ( render.nodeUniform6 * 9.3 ) + 16.793 ) ) * 0.08 ) ) + ( sin( ( ( render.nodeUniform6 * 17.1 ) + 28.548099999999998 ) ) * 0.05 ) ) + ( sin( ( ( render.nodeUniform6 * 29.0 ) + 52.0583 ) ) * 0.03 ) ) ) ) ) ) * vec3<f32>( 2.1 ) ) );
	nodeVar67 = dpdx( v_positionView );
	nodeVar68 = - dpdy( v_positionView );
	NORMAL_normalView = normalViewGeometry;
	NORMAL_nodeVar69 = cross( nodeVar68, NORMAL_normalView );
	NORMAL_nodeVar70 = dot( nodeVar67, NORMAL_nodeVar69 );
	nodeVar71 = ( ( ( ( ( nodeVar44 * 0.014 ) - ( 0.0 * 0.004 ) ) - ( nodeVar45 * 0.006 ) ) + ( 0.0 * 0.0018 ) ) + ( ( ( nodeVar28 - 0.5 ) * 2.0 ) * 0.004 ) );
	nodeVar72 = ( vec3<f32>( sign( NORMAL_nodeVar70 ) ) * ( ( ( vec3<f32>( dpdx( nodeVar71 ) ) * NORMAL_nodeVar69 ) + ( vec3<f32>( - dpdy( nodeVar71 ) ) * cross( NORMAL_normalView, nodeVar67 ) ) ) * vec3<f32>( 1.0 ) ) );
	normalView = normalize( ( ( vec3<f32>( abs( NORMAL_nodeVar70 ) ) * NORMAL_normalView ) - nodeVar72 ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar73 = dot( normalView, positionViewDirection );
	nodeVar74 = textureSample( nodeUniform7, nodeUniform7_sampler, vec2<f32>( Roughness, clamp( nodeVar73, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar74;
	nodeVar75 = ( dfg.x + dfg.y );
	nodeVar76 = ( 1.0 / nodeVar75 );
	nodeVar77 = nodeVar76;
	nodeVar78 = ( nodeVar77 - 1.0 );
	nodeVar79 = ( SpecularColorBlended * vec3<f32>( nodeVar78 ) );
	nodeVar80 = ( nodeVar79 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar80;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar81 = dot( normalWorld, normalize( render.nodeUniform11 ) );
	nodeVar82 = ( nodeVar81 * 0.5 );
	nodeVar83 = ( nodeVar82 + 0.5 );
	nodeVar84 = mix( render.nodeUniform8, render.nodeUniform9, nodeVar83 );
	nodeVar85 = ( irradiance + nodeVar84 );
	irradiance = nodeVar85;
	nodeVar86 = ( render.nodeUniform12 - render.nodeUniform13 );
	nodeVar87 = vec4<f32>( nodeVar86, 0.0 );
	nodeVar88 = ( render.cameraViewMatrix * nodeVar87 );
	nodeVar89 = normalize( nodeVar88.xyz );
	nodeVar90 = nodeVar89;
	nodeVar91 = dot( normalView, nodeVar90 );
	nodeVar92 = ( vec3<f32>( clamp( nodeVar91, 0.0, 1.0 ) ) * render.nodeUniform14 );
	nodeVar93 = nodeVar92;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar94 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar95 = ( nodeVar93 * nodeVar94 );
	nodeVar96 = ( nodeVar90 + positionViewDirection );
	nodeVar97 = normalize( nodeVar96 );
	nodeVar98 = dot( positionViewDirection, nodeVar97 );
	nodeVar99 = clamp( nodeVar98, 0.0, 1.0 );
	nodeVar100 = exp2( ( ( ( nodeVar99 * -5.55473 ) - 6.98316 ) * nodeVar99 ) );
	nodeVar101 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar100 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar100 ) ) );
	nodeVar102 = ( vec3<f32>( 1.0 ) - nodeVar101 );
	nodeVar103 = nodeVar102;
	nodeVar104 = ( nodeVar95 * nodeVar103 );
	nodeVar105 = ( directDiffuse + nodeVar104 );
	directDiffuse = nodeVar105;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar106 = normalize( ( nodeVar90 + positionViewDirection ) );
	nodeVar107 = clamp( dot( positionViewDirection, nodeVar106 ), 0.0, 1.0 );
	nodeVar108 = exp2( ( ( ( nodeVar107 * -5.55473 ) - 6.98316 ) * nodeVar107 ) );
	nodeVar109 = ( Roughness * Roughness );
	nodeVar110 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar108 ) ) ) + vec3<f32>( ( 1.0 * nodeVar108 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar109, clamp( dot( normalView, nodeVar90 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar109, clamp( dot( normalView, nodeVar106 ), 0.0, 1.0 ) ) ) );
	nodeVar111 = ( nodeVar93 * nodeVar110 );
	nodeVar112 = ( nodeVar111 * multiScatteringCompensation );
	nodeVar113 = ( directSpecular + nodeVar112 );
	directSpecular = nodeVar113;
	nodeVar114 = ( render.nodeUniform15 - render.nodeUniform16 );
	nodeVar115 = vec4<f32>( nodeVar114, 0.0 );
	nodeVar116 = ( render.cameraViewMatrix * nodeVar115 );
	nodeVar117 = normalize( nodeVar116.xyz );
	nodeVar118 = nodeVar117;
	nodeVar119 = dot( normalView, nodeVar118 );
	shadowPositionWorld = v_positionWorld;
	nodeVar121 = ( render.nodeUniform18 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform19 ) ) ), 1.0 ) );
	nodeVar122 = ( nodeVar121.xyz / vec3<f32>( nodeVar121.w ) );
	nodeVar123 = vec3<f32>( nodeVar122.x, ( 1.0 - nodeVar122.y ), ( nodeVar122.z + render.nodeUniform20 ) );

	if ( ( ( ( ( ( nodeVar123.x >= 0.0 ) && ( nodeVar123.x <= 1.0 ) ) && ( nodeVar123.y >= 0.0 ) ) && ( nodeVar123.y <= 1.0 ) ) && ( nodeVar123.z <= 1.0 ) ) ) {

		nodeVar124 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar125 = ( render.nodeUniform22 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform23 ).x );
		nodeVar126 = ( nodeVar123.xy + ( vogelDiskSample( 0, 5, nodeVar124 ) * vec2<f32>( nodeVar125 ) ) );
		nodeVar127 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar126, nodeVar123.z );
		nodeVar128 = ( nodeVar123.xy + ( vogelDiskSample( 1, 5, nodeVar124 ) * vec2<f32>( nodeVar125 ) ) );
		nodeVar129 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar128, nodeVar123.z );
		nodeVar130 = ( nodeVar123.xy + ( vogelDiskSample( 2, 5, nodeVar124 ) * vec2<f32>( nodeVar125 ) ) );
		nodeVar131 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar130, nodeVar123.z );
		nodeVar132 = ( nodeVar123.xy + ( vogelDiskSample( 3, 5, nodeVar124 ) * vec2<f32>( nodeVar125 ) ) );
		nodeVar133 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar132, nodeVar123.z );
		nodeVar134 = ( nodeVar123.xy + ( vogelDiskSample( 4, 5, nodeVar124 ) * vec2<f32>( nodeVar125 ) ) );
		nodeVar135 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar134, nodeVar123.z );
		nodeVar120 = ( ( ( ( ( nodeVar127 + nodeVar129 ) + nodeVar131 ) + nodeVar133 ) + nodeVar135 ) * 0.2 );

	} else {

		nodeVar120 = 1.0;

	}

	nodeVar136 = mix( 1.0, nodeVar120, render.nodeUniform24 );
	nodeVar137 = ( vec3<f32>( clamp( nodeVar119, 0.0, 1.0 ) ) * ( render.nodeUniform17 * vec3<f32>( nodeVar136 ) ) );
	nodeVar138 = nodeVar137;
	nodeVar139 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar140 = ( nodeVar138 * nodeVar139 );
	nodeVar141 = ( nodeVar118 + positionViewDirection );
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
	nodeVar151 = normalize( ( nodeVar118 + positionViewDirection ) );
	nodeVar152 = clamp( dot( positionViewDirection, nodeVar151 ), 0.0, 1.0 );
	nodeVar153 = exp2( ( ( ( nodeVar152 * -5.55473 ) - 6.98316 ) * nodeVar152 ) );
	nodeVar154 = ( Roughness * Roughness );
	nodeVar155 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar153 ) ) ) + vec3<f32>( ( 1.0 * nodeVar153 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar154, clamp( dot( normalView, nodeVar118 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar154, clamp( dot( normalView, nodeVar151 ), 0.0, 1.0 ) ) ) );
	nodeVar156 = ( nodeVar138 * nodeVar155 );
	nodeVar157 = ( nodeVar156 * multiScatteringCompensation );
	nodeVar158 = ( directSpecular + nodeVar157 );
	directSpecular = nodeVar158;
	nodeVar159 = ( render.nodeUniform25 - v_positionView );
	nodeVar160 = normalize( nodeVar159 );
	nodeVar161 = dot( normalView, nodeVar160 );

	if ( ( render.nodeUniform27 > 0.0 ) ) {

		nodeVar163 = length( nodeVar159 );
		nodeVar164 = ( nodeVar163 / render.nodeUniform27 );
		nodeVar165 = clamp( ( 1.0 - ( ( ( nodeVar164 * nodeVar164 ) * nodeVar164 ) * nodeVar164 ) ), 0.0, 1.0 );
		nodeVar162 = ( ( 1.0 / max( pow( nodeVar163, render.nodeUniform28 ), 0.01 ) ) * ( nodeVar165 * nodeVar165 ) );

	} else {

		nodeVar162 = ( 1.0 / max( pow( length( nodeVar159 ), render.nodeUniform28 ), 0.01 ) );

	}

	nodeVar166 = ( render.nodeUniform26 * vec3<f32>( nodeVar162 ) );
	nodeVar167 = ( vec3<f32>( clamp( nodeVar161, 0.0, 1.0 ) ) * nodeVar166 );
	nodeVar168 = nodeVar167;
	nodeVar169 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar170 = ( nodeVar168 * nodeVar169 );
	nodeVar171 = ( nodeVar160 + positionViewDirection );
	nodeVar172 = normalize( nodeVar171 );
	nodeVar173 = dot( positionViewDirection, nodeVar172 );
	nodeVar174 = clamp( nodeVar173, 0.0, 1.0 );
	nodeVar175 = exp2( ( ( ( nodeVar174 * -5.55473 ) - 6.98316 ) * nodeVar174 ) );
	nodeVar176 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar175 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar175 ) ) );
	nodeVar177 = ( vec3<f32>( 1.0 ) - nodeVar176 );
	nodeVar178 = nodeVar177;
	nodeVar179 = ( nodeVar170 * nodeVar178 );
	nodeVar180 = ( directDiffuse + nodeVar179 );
	directDiffuse = nodeVar180;
	nodeVar181 = normalize( ( nodeVar160 + positionViewDirection ) );
	nodeVar182 = clamp( dot( positionViewDirection, nodeVar181 ), 0.0, 1.0 );
	nodeVar183 = exp2( ( ( ( nodeVar182 * -5.55473 ) - 6.98316 ) * nodeVar182 ) );
	nodeVar184 = ( Roughness * Roughness );
	nodeVar185 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar183 ) ) ) + vec3<f32>( ( 1.0 * nodeVar183 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar184, clamp( dot( normalView, nodeVar160 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar184, clamp( dot( normalView, nodeVar181 ), 0.0, 1.0 ) ) ) );
	nodeVar186 = ( nodeVar168 * nodeVar185 );
	nodeVar187 = ( nodeVar186 * multiScatteringCompensation );
	nodeVar188 = ( directSpecular + nodeVar187 );
	directSpecular = nodeVar188;
	nodeVar189 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar190 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar191 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar192 = ( SpecularF90 * dfg.y );
	nodeVar193 = ( nodeVar191 + vec3<f32>( nodeVar192 ) );
	nodeVar194 = ( nodeVar189 + nodeVar193 );
	nodeVar189 = nodeVar194;
	nodeVar195 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar196 = nodeVar195;
	nodeVar197 = ( nodeVar196 * vec3<f32>( 0.047619 ) );
	nodeVar198 = ( SpecularColor + nodeVar197 );
	nodeVar199 = ( nodeVar193 * nodeVar198 );
	nodeVar200 = ( dfg.x + dfg.y );
	nodeVar201 = ( 1.0 - nodeVar200 );
	nodeVar202 = nodeVar201;
	nodeVar203 = ( vec3<f32>( nodeVar202 ) * nodeVar198 );
	nodeVar204 = ( vec3<f32>( 1.0 ) - nodeVar203 );
	nodeVar205 = nodeVar204;
	nodeVar206 = ( nodeVar199 / nodeVar205 );
	nodeVar207 = ( nodeVar206 * vec3<f32>( nodeVar202 ) );
	nodeVar208 = ( nodeVar190 + nodeVar207 );
	nodeVar190 = nodeVar208;
	nodeVar209 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar210 = ( irradiance * nodeVar209 );
	nodeVar211 = ( nodeVar189 + nodeVar190 );
	nodeVar212 = ( vec3<f32>( 1.0 ) - nodeVar211 );
	nodeVar213 = nodeVar212;
	nodeVar214 = ( nodeVar210 * nodeVar213 );
	nodeVar215 = nodeVar214;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar216 = ( indirectDiffuse + nodeVar215 );
	indirectDiffuse = nodeVar216;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar217 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar218 = ( SpecularF90 * dfg.y );
	nodeVar219 = ( nodeVar217 + vec3<f32>( nodeVar218 ) );
	nodeVar220 = ( singleScatteringDielectric + nodeVar219 );
	singleScatteringDielectric = nodeVar220;
	nodeVar221 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar222 = nodeVar221;
	nodeVar223 = ( nodeVar222 * vec3<f32>( 0.047619 ) );
	nodeVar224 = ( SpecularColor + nodeVar223 );
	nodeVar225 = ( nodeVar219 * nodeVar224 );
	nodeVar226 = ( dfg.x + dfg.y );
	nodeVar227 = ( 1.0 - nodeVar226 );
	nodeVar228 = nodeVar227;
	nodeVar229 = ( vec3<f32>( nodeVar228 ) * nodeVar224 );
	nodeVar230 = ( vec3<f32>( 1.0 ) - nodeVar229 );
	nodeVar231 = nodeVar230;
	nodeVar232 = ( nodeVar225 / nodeVar231 );
	nodeVar233 = ( nodeVar232 * vec3<f32>( nodeVar228 ) );
	nodeVar234 = ( multiScatteringDielectric + nodeVar233 );
	multiScatteringDielectric = nodeVar234;
	nodeVar235 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar236 = ( SpecularF90 * dfg.y );
	nodeVar237 = ( nodeVar235 + vec3<f32>( nodeVar236 ) );
	nodeVar238 = ( singleScatteringMetallic + nodeVar237 );
	singleScatteringMetallic = nodeVar238;
	nodeVar239 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar240 = nodeVar239;
	nodeVar241 = ( nodeVar240 * vec3<f32>( 0.047619 ) );
	nodeVar242 = ( DiffuseColor.xyz + nodeVar241 );
	nodeVar243 = ( nodeVar237 * nodeVar242 );
	nodeVar244 = ( dfg.x + dfg.y );
	nodeVar245 = ( 1.0 - nodeVar244 );
	nodeVar246 = nodeVar245;
	nodeVar247 = ( vec3<f32>( nodeVar246 ) * nodeVar242 );
	nodeVar248 = ( vec3<f32>( 1.0 ) - nodeVar247 );
	nodeVar249 = nodeVar248;
	nodeVar250 = ( nodeVar243 / nodeVar249 );
	nodeVar251 = ( nodeVar250 * vec3<f32>( nodeVar246 ) );
	nodeVar252 = ( multiScatteringMetallic + nodeVar251 );
	multiScatteringMetallic = nodeVar252;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar253 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar254 = ( radiance * nodeVar253 );
	nodeVar255 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar256 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar257 = ( nodeVar255 * nodeVar256 );
	nodeVar258 = ( nodeVar254 + nodeVar257 );
	nodeVar259 = nodeVar258;
	nodeVar260 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar261 = ( vec3<f32>( 1.0 ) - nodeVar260 );
	nodeVar262 = nodeVar261;
	nodeVar263 = ( DiffuseContribution * nodeVar262 );
	nodeVar264 = ( nodeVar263 * nodeVar256 );
	nodeVar265 = nodeVar264;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar266 = ( indirectSpecular + nodeVar259 );
	indirectSpecular = nodeVar266;
	nodeVar267 = ( indirectDiffuse + nodeVar265 );
	indirectDiffuse = nodeVar267;
	ambientOcclusion = 1.0;
	nodeVar268 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar268;
	nodeVar269 = dot( normalView, positionViewDirection );
	nodeVar270 = ( clamp( nodeVar269, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar271 = ( Roughness * -16.0 );
	nodeVar272 = ( 1.0 - nodeVar271 );
	nodeVar273 = nodeVar272;
	nodeVar274 = ( - nodeVar273 );
	nodeVar275 = exp2( nodeVar274 );
	nodeVar276 = pow( nodeVar270, nodeVar275 );
	nodeVar277 = ( 1.0 - nodeVar276 );
	nodeVar278 = nodeVar277;
	nodeVar279 = ( ambientOcclusion - nodeVar278 );
	nodeVar280 = ( indirectSpecular * vec3<f32>( clamp( nodeVar279, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar280;
	nodeVar281 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar281;
	nodeVar282 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar282;
	nodeVar283 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar283;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar284 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar285 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform29, object.nodeUniform30, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform32 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform33 * object.nodeUniform33 ) * nodeVar284 ) * nodeVar284 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar285;

	// result

	output.color = nodeVar285;

	return output;

}
